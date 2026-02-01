'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  BanknotesIcon,
  ArrowPathIcon,
  XCircleIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface BillingTransaction {
  id: string
  user_id: string
  agent_id: string | null
  type: 'purchase' | 'subscription' | 'refund'
  amount_cents: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  stripe_payment_id: string | null
  stripe_charge_id: string | null
  reason: string | null
  metadata: any
  created_at: string
  updated_at: string
  user: { id: string; email: string } | null
  agent: { id: string; name: string } | null
}

interface RefundRequest {
  id: string
  user_id: string
  transaction_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  processed_by: string | null
  processed_at: string | null
  created_at: string
  updated_at: string
  user: { id: string; email: string } | null
  transaction: {
    id: string
    amount_cents: number
    type: string
    stripe_payment_id: string | null
  } | null
  processor: { id: string; email: string } | null
}

interface DeveloperPayout {
  id: string
  developer_id: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  stripe_transfer_id: string | null
  period_start: string
  period_end: string
  processed_at: string | null
  created_at: string
  updated_at: string
  developer: { id: string; email: string } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Statistics {
  total_revenue: number
  total_transactions: number
  successful_transactions: number
  refunded_transactions: number
  failed_transactions: number
}

export default function BillingManagementTab() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'refunds' | 'payouts' | 'analytics'>('transactions')
  const [transactions, setTransactions] = useState<BillingTransaction[]>([])
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([])
  const [payouts, setPayouts] = useState<DeveloperPayout[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    loadData()
  }, [activeTab, pagination.page, filters])

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        action: activeTab === 'transactions' ? 'transactions' : activeTab === 'refunds' ? 'refund_requests' : 'payouts',
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status,
        type: filters.type,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      })

      const response = await fetch(`/api/admin/billing?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const data = await response.json()
      
      if (activeTab === 'transactions') {
        setTransactions(data.transactions || [])
      } else if (activeTab === 'refunds') {
        setRefundRequests(data.refundRequests || [])
      } else if (activeTab === 'payouts') {
        setPayouts(data.payouts || [])
      }
      
      setPagination(data.pagination)

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/admin/billing?action=statistics')
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }

      const data = await response.json()
      setStatistics(data.statistics)

    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }

  const handleApproveRefund = async (refundId: string) => {
    if (!confirm('Are you sure you want to approve this refund? This action cannot be undone.')) {
      return
    }

    try {
      setProcessing(true)

      const response = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_refund',
          refundRequestId: refundId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve refund')
      }

      toast.success('Refund approved successfully')
      loadData()
      loadStatistics()
      setShowRefundModal(false)

    } catch (error) {
      console.error('Error approving refund:', error)
      toast.error('Failed to approve refund')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectRefund = async (refundId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setProcessing(true)

      const response = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_refund',
          refundRequestId: refundId,
          reason: rejectionReason
        })
      })

      if (!response.ok) {
        throw new Error('Failed to reject refund')
      }

      toast.success('Refund rejected successfully')
      loadData()
      setShowRefundModal(false)
      setRejectionReason('')

    } catch (error) {
      console.error('Error rejecting refund:', error)
      toast.error('Failed to reject refund')
    } finally {
      setProcessing(false)
    }
  }

  const handleProcessPayout = async (payoutId: string) => {
    if (!confirm('Are you sure you want to process this payout?')) {
      return
    }

    try {
      setProcessing(true)

      const response = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process_payout',
          payoutId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process payout')
      }

      toast.success('Payout processing initiated')
      loadData()

    } catch (error) {
      console.error('Error processing payout:', error)
      toast.error('Failed to process payout')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${statistics.total_revenue.toFixed(2)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.total_transactions}
                </p>
              </div>
              <BanknotesIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.successful_transactions}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Refunded</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {statistics.refunded_transactions}
                </p>
              </div>
              <ArrowPathIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {statistics.failed_transactions}
                </p>
              </div>
              <XCircleIcon className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'transactions'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('refunds')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'refunds'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Refund Requests
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'payouts'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Developer Payouts
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {activeTab === 'transactions' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="purchase">Purchase</option>
                  <option value="subscription">Subscription</option>
                  <option value="refund">Refund</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                              {transaction.id.substring(0, 8)}...
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {transaction.user?.email || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {transaction.agent?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className="capitalize">{transaction.type}</span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {formatCurrency(transaction.amount_cents)}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {getStatusBadge(transaction.status)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Refund Requests Tab */}
              {activeTab === 'refunds' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {refundRequests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No refund requests found
                          </td>
                        </tr>
                      ) : (
                        refundRequests.map((refund) => (
                          <tr key={refund.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {refund.user?.email || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {refund.transaction ? formatCurrency(refund.transaction.amount_cents) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {refund.reason}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {getStatusBadge(refund.status)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {format(new Date(refund.created_at), 'MMM dd, yyyy HH:mm')}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {refund.status === 'pending' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedRefund(refund)
                                      setShowRefundModal(true)
                                    }}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    Review
                                  </button>
                                </div>
                              )}
                              {refund.status !== 'pending' && (
                                <span className="text-gray-400">
                                  {refund.status === 'approved' ? 'Approved' : 'Rejected'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payouts Tab */}
              {activeTab === 'payouts' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Developer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payouts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No payouts found
                          </td>
                        </tr>
                      ) : (
                        payouts.map((payout) => (
                          <tr key={payout.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {payout.developer?.email || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              ${payout.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {format(new Date(payout.period_start), 'MMM dd')} - {format(new Date(payout.period_end), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {getStatusBadge(payout.status)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {format(new Date(payout.created_at), 'MMM dd, yyyy HH:mm')}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {payout.status === 'pending' && (
                                <button
                                  onClick={() => handleProcessPayout(payout.id)}
                                  disabled={processing}
                                  className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                                >
                                  Process
                                </button>
                              )}
                              {payout.status !== 'pending' && (
                                <span className="text-gray-400 capitalize">{payout.status}</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="text-center py-12 text-gray-500">
                  <p>Revenue analytics charts coming soon...</p>
                  <p className="text-sm mt-2">This will include revenue trends, transaction volume, and more.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refund Review Modal */}
      {showRefundModal && selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Review Refund Request</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRefund.user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {selectedRefund.transaction ? formatCurrency(selectedRefund.transaction.amount_cents) : 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{selectedRefund.transaction_id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRefund.reason}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Requested Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(selectedRefund.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason (if rejecting)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter reason for rejection..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRefundModal(false)
                  setSelectedRefund(null)
                  setRejectionReason('')
                }}
                disabled={processing}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectRefund(selectedRefund.id)}
                disabled={processing || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <XCircleIcon className="h-5 w-5" />
                Reject
              </button>
              <button
                onClick={() => handleApproveRefund(selectedRefund.id)}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
