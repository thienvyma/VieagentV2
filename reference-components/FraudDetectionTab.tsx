'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  ShieldExclamationIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

interface FraudAlert {
  id: string
  user_id: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata: any
  status: 'pending' | 'investigating' | 'resolved' | 'false_positive'
  resolution: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  user: {
    id: string
    email: string
    role: string
  }
  resolver: {
    id: string
    email: string
  } | null
}

interface FraudStatistics {
  total: number
  pending: number
  investigating: number
  resolved: number
  falsePositive: number
  critical: number
  high: number
  medium: number
  low: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function FraudDetectionTab() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<FraudStatistics | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<string>('')
  const [actionReason, setActionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const [filters, setFilters] = useState({
    severity: 'all',
    status: 'all',
    alertType: 'all'
  })

  useEffect(() => {
    loadAlerts()
  }, [pagination.page, filters])

  const loadAlerts = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        severity: filters.severity,
        status: filters.status,
        alertType: filters.alertType
      })

      const response = await fetch(`/api/admin/fraud-detection?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch fraud alerts')
      }

      const data = await response.json()
      setAlerts(data.alerts)
      setPagination(data.pagination)
      setStatistics(data.statistics)

    } catch (error) {
      console.error('Error loading fraud alerts:', error)
      toast.error('Failed to load fraud alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedAlert) return

    try {
      setProcessing(true)

      const response = await fetch('/api/admin/fraud-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: actionType,
          alertId: selectedAlert.id,
          userId: selectedAlert.user_id,
          reason: actionReason,
          resolution: actionReason
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Action failed')
      }

      const result = await response.json()
      toast.success(result.message)

      // Reload alerts
      await loadAlerts()

      // Close modals
      setShowActionModal(false)
      setShowDetailModal(false)
      setSelectedAlert(null)
      setActionReason('')

    } catch (error: any) {
      console.error('Error performing action:', error)
      toast.error(error.message || 'Failed to perform action')
    } finally {
      setProcessing(false)
    }
  }

  const openActionModal = (alert: FraudAlert, action: string) => {
    setSelectedAlert(alert)
    setActionType(action)
    setShowActionModal(true)
  }

  const handleExportCSV = async () => {
    try {
      setIsExporting(true)

      // Fetch all alerts matching current filters (no pagination)
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Get all alerts
        severity: filters.severity,
        status: filters.status,
        alertType: filters.alertType
      })

      const response = await fetch(`/api/admin/fraud-detection?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch fraud alerts for export')
      }

      const data = await response.json()
      const allAlerts = data.alerts

      // Convert to CSV
      const headers = [
        'Alert ID',
        'Alert Type',
        'Severity',
        'Status',
        'User Email',
        'User Role',
        'Description',
        'Created At',
        'Resolved At',
        'Resolved By',
        'Resolution'
      ]

      const csvRows = [
        headers.join(','),
        ...allAlerts.map((alert: FraudAlert) => [
          alert.id,
          alert.alert_type,
          alert.severity,
          alert.status,
          alert.user?.email || 'Unknown',
          alert.user?.role || 'N/A',
          `"${alert.description.replace(/"/g, '""')}"`, // Escape quotes
          format(new Date(alert.created_at), 'yyyy-MM-dd HH:mm:ss'),
          alert.resolved_at ? format(new Date(alert.resolved_at), 'yyyy-MM-dd HH:mm:ss') : '',
          alert.resolver?.email || '',
          alert.resolution ? `"${alert.resolution.replace(/"/g, '""')}"` : ''
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `fraud-alerts-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Exported ${allAlerts.length} fraud alerts`)

    } catch (error) {
      console.error('Error exporting fraud alerts:', error)
      toast.error('Failed to export fraud alerts')
    } finally {
      setIsExporting(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'investigating':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'false_positive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Fraud Detection
        </h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400">
          {statistics?.pending || 0} pending alerts
        </span>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total}</p>
              </div>
              <ShieldExclamationIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Critical</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statistics.critical}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Investigating</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statistics.investigating}</p>
              </div>
              <EyeIcon className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statistics.resolved}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</h3>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={isExporting || alerts.length === 0}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-300 mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export CSV
              </>
            )}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, severity: e.target.value }))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, status: e.target.value }))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False Positive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Alert Type
            </label>
            <select
              value={filters.alertType}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, alertType: e.target.value }))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="payment">Payment</option>
              <option value="authentication">Authentication</option>
              <option value="purchase">Purchase</option>
              <option value="refund">Refund</option>
              <option value="network">Network</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Alert
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.alert_type.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {alert.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {alert.user?.email || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {alert.user?.role || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                          {alert.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(alert.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAlert(alert)
                              setShowDetailModal(true)
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {alert.status === 'pending' && (
                            <button
                              onClick={() => openActionModal(alert, 'investigate')}
                              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
                              title="Investigate"
                            >
                              <ExclamationTriangleIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {alerts.length === 0 && !loading && (
              <div className="text-center py-12">
                <ShieldExclamationIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No fraud alerts
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No fraud alerts match your current filters.
                </p>
              </div>
            )}

            {/* Pagination */}
            {alerts.length > 0 && (
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
                      Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                      <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAlert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Fraud Alert Details
                </h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedAlert(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Alert Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Alert Type
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedAlert.alert_type.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Severity
                    </label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(selectedAlert.severity)}`}>
                      {selectedAlert.severity}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAlert.status)}`}>
                      {selectedAlert.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {format(new Date(selectedAlert.created_at), 'MMM d, yyyy HH:mm:ss')}
                    </p>
                  </div>
                </div>

                {/* User Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User Information
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Email:</span> {selectedAlert.user?.email || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      <span className="font-medium">Role:</span> {selectedAlert.user?.role || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      <span className="font-medium">User ID:</span> {selectedAlert.user_id}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    {selectedAlert.description}
                  </p>
                </div>

                {/* Metadata */}
                {selectedAlert.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Evidence & Metadata
                    </label>
                    <pre className="text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 rounded-lg p-3 overflow-x-auto">
                      {JSON.stringify(selectedAlert.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Resolution */}
                {selectedAlert.resolution && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Resolution
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      {selectedAlert.resolution}
                    </p>
                    {selectedAlert.resolver && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Resolved by {selectedAlert.resolver.email} on{' '}
                        {selectedAlert.resolved_at && format(new Date(selectedAlert.resolved_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {selectedAlert.status !== 'resolved' && selectedAlert.status !== 'false_positive' && (
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        openActionModal(selectedAlert, 'false_positive')
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Mark False Positive
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        openActionModal(selectedAlert, 'whitelist')
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Whitelist User
                    </button>
                    {selectedAlert.status === 'pending' && (
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          openActionModal(selectedAlert, 'investigate')
                        }}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Investigate
                      </button>
                    )}
                    {selectedAlert.status === 'investigating' && (
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          openActionModal(selectedAlert, 'resolve')
                        }}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        openActionModal(selectedAlert, 'block_user')
                      }}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Block User
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showActionModal && selectedAlert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-center mb-4">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                  actionType === 'block_user' ? 'bg-red-100 dark:bg-red-900/20' : 'bg-blue-100 dark:bg-blue-900/20'
                }`}>
                  {actionType === 'block_user' ? (
                    <NoSymbolIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  ) : actionType === 'false_positive' ? (
                    <XCircleIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <CheckCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
                {actionType === 'investigate' && 'Mark as Investigating'}
                {actionType === 'resolve' && 'Resolve Alert'}
                {actionType === 'false_positive' && 'Mark as False Positive'}
                {actionType === 'block_user' && 'Block User'}
                {actionType === 'whitelist' && 'Whitelist User'}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                {actionType === 'investigate' && 'This will mark the alert as under investigation.'}
                {actionType === 'resolve' && 'This will mark the alert as resolved.'}
                {actionType === 'false_positive' && 'This will mark the alert as a false positive.'}
                {actionType === 'block_user' && 'This will block the user and suspend their account.'}
                {actionType === 'whitelist' && 'This will add the user to the whitelist and mark the alert as false positive.'}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {actionType === 'block_user' ? 'Reason (required)' : 'Notes (optional)'}
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter reason or notes..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowActionModal(false)
                    setActionReason('')
                  }}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={processing || (actionType === 'block_user' && !actionReason)}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    actionType === 'block_user'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processing ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
