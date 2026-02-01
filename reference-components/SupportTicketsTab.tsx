'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FireIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface SupportTicket {
  id: string
  user_id: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'escalated'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assigned_to: string | null
  resolution: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  user_email?: string
  assigned_admin_email?: string
}

interface TicketResponse {
  id: string
  ticket_id: string
  user_id: string
  message: string
  is_admin_response: boolean
  created_at: string
  user_email?: string
}

interface ResponseTemplate {
  id: string
  title: string
  content: string
  category: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function SupportTicketsTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketResponses, setTicketResponses] = useState<TicketResponse[]>([])
  const [responseTemplates, setResponseTemplates] = useState<ResponseTemplate[]>([])
  const [newResponse, setNewResponse] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    dateFrom: '',
    dateTo: ''
  })
  
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const [stats, setStats] = useState({
    open: 0,
    in_progress: 0,
    resolved: 0,
    escalated: 0,
    critical: 0
  })

  useEffect(() => {
    loadTickets()
    loadResponseTemplates()
  }, [pagination.page, filters])

  useEffect(() => {
    if (selectedTicket) {
      loadTicketResponses(selectedTicket.id)
    }
  }, [selectedTicket])

  const loadTickets = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status,
        priority: filters.priority,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      })

      const response = await fetch(`/api/admin/support-tickets?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets')
      }

      const data = await response.json()
      setTickets(data.tickets)
      setPagination(data.pagination)
      setStats(data.stats)

    } catch (error) {
      console.error('Error loading tickets:', error)
      toast.error('Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  const loadTicketResponses = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/admin/support-tickets/${ticketId}/responses`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch responses')
      }

      const data = await response.json()
      setTicketResponses(data.responses)

    } catch (error) {
      console.error('Error loading responses:', error)
      toast.error('Failed to load ticket responses')
    }
  }

  const loadResponseTemplates = async () => {
    try {
      const response = await fetch('/api/admin/support-tickets/templates')
      
      if (response.ok) {
        const data = await response.json()
        setResponseTemplates(data.templates)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleAssignToMe = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/admin/support-tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to assign ticket')
      }

      toast.success('Ticket assigned to you')
      await loadTickets()
      
      if (selectedTicket?.id === ticketId) {
        const updatedTicket = tickets.find(t => t.id === ticketId)
        if (updatedTicket) {
          setSelectedTicket(updatedTicket)
        }
      }

    } catch (error) {
      console.error('Error assigning ticket:', error)
      toast.error('Failed to assign ticket')
    }
  }

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/support-tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast.success(`Ticket status updated to ${newStatus}`)
      await loadTickets()
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as any })
      }

    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update ticket status')
    }
  }

  const handleAddResponse = async () => {
    if (!selectedTicket || !newResponse.trim()) {
      toast.error('Please enter a response')
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/admin/support-tickets/${selectedTicket.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newResponse })
      })

      if (!response.ok) {
        throw new Error('Failed to add response')
      }

      toast.success('Response added successfully')
      setNewResponse('')
      setSelectedTemplate('')
      await loadTicketResponses(selectedTicket.id)

    } catch (error) {
      console.error('Error adding response:', error)
      toast.error('Failed to add response')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResolveTicket = async (ticketId: string, resolution: string) => {
    try {
      const response = await fetch(`/api/admin/support-tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolution })
      })

      if (!response.ok) {
        throw new Error('Failed to resolve ticket')
      }

      toast.success('Ticket resolved successfully')
      setIsDetailModalOpen(false)
      await loadTickets()

    } catch (error) {
      console.error('Error resolving ticket:', error)
      toast.error('Failed to resolve ticket')
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = responseTemplates.find(t => t.id === templateId)
    if (template) {
      setNewResponse(template.content)
      setSelectedTemplate(templateId)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'in_progress': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'escalated': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <FireIcon className="h-4 w-4" />
      case 'high': return <ExclamationTriangleIcon className="h-4 w-4" />
      default: return null
    }
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Support Tickets
        </h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
          {pagination.total} total tickets
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Open
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.open}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    In Progress
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.in_progress}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Resolved
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.resolved}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Escalated
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.escalated}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FireIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Critical
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.critical}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by status
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, status: e.target.value }))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by priority
            </label>
            <select
              id="priority"
              value={filters.priority}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, priority: e.target.value }))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Date From Filter */}
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From date
            </label>
            <input
              type="date"
              id="dateFrom"
              value={filters.dateFrom}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, dateFrom: e.target.value }))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To date
            </label>
            <input
              type="date"
              id="dateTo"
              value={filters.dateTo}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, dateTo: e.target.value }))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-start min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getPriorityIcon(ticket.priority)}
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {ticket.subject}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {ticket.user_email} • {format(new Date(ticket.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {ticket.message}
                        </p>
                        {ticket.assigned_to && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Assigned to: {ticket.assigned_admin_email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket)
                          setIsDetailModalOpen(true)
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      {!ticket.assigned_to && ticket.status !== 'resolved' && (
                        <button
                          onClick={() => handleAssignToMe(ticket.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <UserIcon className="h-4 w-4 mr-1" />
                          Assign to Me
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Empty State */}
            {tickets.length === 0 && (
              <div className="text-center py-12">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No tickets found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your filters.
                </p>
              </div>
            )}

            {/* Pagination */}
            {tickets.length > 0 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{' '}
                      <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{pagination.total}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {isDetailModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800 mb-10">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getPriorityIcon(selectedTicket.priority)}
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedTicket.subject}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    From: {selectedTicket.user_email} • Created: {format(new Date(selectedTicket.created_at), 'MMM d, yyyy HH:mm')}
                  </p>
                  {selectedTicket.assigned_to && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Assigned to: {selectedTicket.assigned_admin_email}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Status Actions */}
              {selectedTicket.status !== 'resolved' && (
                <div className="mb-4 flex gap-2">
                  {selectedTicket.status === 'open' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Start Working
                    </button>
                  )}
                  {selectedTicket.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'escalated')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Escalate
                    </button>
                  )}
                  {!selectedTicket.assigned_to && (
                    <button
                      onClick={() => handleAssignToMe(selectedTicket.id)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <UserIcon className="h-4 w-4 mr-1" />
                      Assign to Me
                    </button>
                  )}
                </div>
              )}

              {/* Original Message */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Original Message
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedTicket.message}
                  </p>
                </div>
              </div>

              {/* Conversation History */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Conversation History
                </h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {ticketResponses.map((response) => (
                    <div
                      key={response.id}
                      className={`rounded-lg p-4 ${
                        response.is_admin_response
                          ? 'bg-blue-50 dark:bg-blue-900/20 ml-8'
                          : 'bg-gray-50 dark:bg-gray-900 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {response.is_admin_response ? 'Admin' : 'User'}: {response.user_email}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(response.created_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {response.message}
                      </p>
                    </div>
                  ))}
                  {ticketResponses.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No responses yet
                    </p>
                  )}
                </div>
              </div>

              {/* Add Response Section */}
              {selectedTicket.status !== 'resolved' && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Add Response
                  </h4>
                  
                  {/* Template Selector */}
                  {responseTemplates.length > 0 && (
                    <div className="mb-3">
                      <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Use Template (optional)
                      </label>
                      <select
                        id="template"
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select a template...</option>
                        {responseTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.title} ({template.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    rows={4}
                    placeholder="Type your response here..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleAddResponse}
                      disabled={isSubmitting || !newResponse.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        'Send Response'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Resolve Ticket Section */}
              {selectedTicket.status !== 'resolved' && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Resolve Ticket
                  </h4>
                  <textarea
                    id="resolution"
                    rows={3}
                    placeholder="Enter resolution summary..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white mb-2"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        const resolutionInput = document.getElementById('resolution') as HTMLTextAreaElement
                        if (resolutionInput?.value.trim()) {
                          handleResolveTicket(selectedTicket.id, resolutionInput.value)
                        } else {
                          toast.error('Please enter a resolution summary')
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </button>
                  </div>
                </div>
              )}

              {/* Resolution Display (if resolved) */}
              {selectedTicket.status === 'resolved' && selectedTicket.resolution && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Resolution
                  </h4>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedTicket.resolution}
                    </p>
                    {selectedTicket.resolved_at && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Resolved on: {format(new Date(selectedTicket.resolved_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
