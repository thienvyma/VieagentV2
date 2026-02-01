'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  XMarkIcon, 
  UserIcon,
  CreditCardIcon,
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface UserDetailModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onUserUpdated?: () => void
}

interface UserDetail {
  id: string
  email: string
  role: string
  plan: string
  status: string
  stripe_customer_id: string | null
  subscription_id: string | null
  active_until: string | null
  created_at: string
  updated_at: string
  last_login: string | null
  stats: {
    total_spent: number
    agents_purchased: number
    total_executions: number
    successful_executions: number
  }
  purchased_agents: Array<{
    id: string
    purchase_date: string
    active: boolean
    status: string
    agent: {
      id: string
      name: string
      cover_image: string
      price_one_time: number | null
      price_monthly: number | null
    }
  }>
  recent_purchases: Array<{
    id: string
    amount_cents: number
    created_at: string
    stripe_payment_id: string
  }>
  recent_executions: Array<{
    id: string
    status: string
    created_at: string
    execution_time_ms: number | null
    user_agent: {
      agent: {
        name: string
      }
    }
  }>
}

export default function UserDetailModal({ userId, isOpen, onClose, onUserUpdated }: UserDetailModalProps) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserDetail | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'purchases' | 'executions'>('overview')
  const [confirmAction, setConfirmAction] = useState<{
    action: 'suspend' | 'unsuspend' | 'promote' | 'demote'
    reason?: string
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      loadUserDetails()
    }
  }, [isOpen, userId])

  const loadUserDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch user details')
      }

      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error('Error loading user details:', error)
      toast.error('Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = (action: 'suspend' | 'unsuspend' | 'promote' | 'demote') => {
    setConfirmAction({ action })
  }

  const confirmUserAction = async () => {
    if (!confirmAction || !user) return

    try {
      setActionLoading(true)
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: confirmAction.action,
          reason: confirmAction.reason
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to perform action')
      }

      const data = await response.json()
      
      // Show success message
      const actionMessages = {
        suspend: 'User suspended successfully',
        unsuspend: 'User unsuspended successfully',
        promote: 'User promoted to admin successfully',
        demote: 'User demoted from admin successfully'
      }
      toast.success(actionMessages[confirmAction.action])

      // Reload user details
      await loadUserDetails()
      
      // Notify parent to refresh user list
      if (onUserUpdated) {
        onUserUpdated()
      }
      
      // Close confirmation dialog
      setConfirmAction(null)

    } catch (error: any) {
      console.error('Error performing user action:', error)
      toast.error(error.message || 'Failed to perform action')
    } finally {
      setActionLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : user ? (
              <>
                {/* User Info Header */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {user.email}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                              : user.role === 'developer'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {user.role}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {user.status}
                          </span>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            {user.plan}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <p>Joined: {format(new Date(user.created_at), 'MMM d, yyyy')}</p>
                      {user.last_login && (
                        <p>Last login: {format(new Date(user.last_login), 'MMM d, yyyy HH:mm')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center">
                      <CreditCardIcon className="h-8 w-8 text-green-500" />
                      <div className="ml-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${(user.stats.total_spent / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center">
                      <CubeIcon className="h-8 w-8 text-blue-500" />
                      <div className="ml-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Agents</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {user.stats.agents_purchased}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center">
                      <ClockIcon className="h-8 w-8 text-purple-500" />
                      <div className="ml-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Executions</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {user.stats.total_executions}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-8 w-8 text-green-500" />
                      <div className="ml-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {user.stats.total_executions > 0 
                            ? Math.round((user.stats.successful_executions / user.stats.total_executions) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                  <nav className="-mb-px flex space-x-8">
                    {[
                      { id: 'overview', name: 'Overview' },
                      { id: 'agents', name: 'Purchased Agents' },
                      { id: 'purchases', name: 'Purchase History' },
                      { id: 'executions', name: 'Executions' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                        }`}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="max-h-96 overflow-y-auto">
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</label>
                          <p className="text-sm text-gray-900 dark:text-white font-mono">{user.id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                          <p className="text-sm text-gray-900 dark:text-white">{user.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
                          <p className="text-sm text-gray-900 dark:text-white capitalize">{user.role}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan</label>
                          <p className="text-sm text-gray-900 dark:text-white capitalize">{user.plan}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                          <p className="text-sm text-gray-900 dark:text-white capitalize">{user.status}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {format(new Date(user.created_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                        {user.stripe_customer_id && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Stripe Customer ID</label>
                            <p className="text-sm text-gray-900 dark:text-white font-mono">{user.stripe_customer_id}</p>
                          </div>
                        )}
                        {user.active_until && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription Active Until</label>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {format(new Date(user.active_until), 'MMM d, yyyy')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'agents' && (
                    <div className="space-y-3">
                      {user.purchased_agents.length > 0 ? (
                        user.purchased_agents.map((userAgent) => (
                          <div 
                            key={userAgent.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={userAgent.agent.cover_image}
                                alt={userAgent.agent.name}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {userAgent.agent.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Purchased: {format(new Date(userAgent.purchase_date), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                userAgent.status === 'ready'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : userAgent.status === 'running'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                  : userAgent.status === 'error'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              }`}>
                                {userAgent.status}
                              </span>
                              {!userAgent.active && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No agents purchased yet
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'purchases' && (
                    <div className="space-y-3">
                      {user.recent_purchases.length > 0 ? (
                        user.recent_purchases.map((purchase) => (
                          <div 
                            key={purchase.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                ${(purchase.amount_cents / 100).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {format(new Date(purchase.created_at), 'MMM d, yyyy HH:mm')}
                              </p>
                            </div>
                            {purchase.stripe_payment_id && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {purchase.stripe_payment_id}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No purchase history
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'executions' && (
                    <div className="space-y-3">
                      {user.recent_executions.length > 0 ? (
                        user.recent_executions.map((execution) => (
                          <div 
                            key={execution.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              {execution.status === 'success' ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              ) : execution.status === 'failed' ? (
                                <XCircleIcon className="h-5 w-5 text-red-500" />
                              ) : (
                                <ClockIcon className="h-5 w-5 text-yellow-500" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {execution.user_agent?.agent?.name || 'Unknown Agent'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {format(new Date(execution.created_at), 'MMM d, yyyy HH:mm')}
                                  {execution.execution_time_ms && ` • ${execution.execution_time_ms}ms`}
                                </p>
                              </div>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              execution.status === 'success'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : execution.status === 'failed'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : execution.status === 'running'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}>
                              {execution.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No execution history
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                User not found
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            {user && (
              <div className="flex space-x-2">
                {/* Suspend/Unsuspend Button */}
                {user.status === 'active' ? (
                  <button
                    onClick={() => handleUserAction('suspend')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Suspend User
                  </button>
                ) : (
                  <button
                    onClick={() => handleUserAction('unsuspend')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Unsuspend User
                  </button>
                )}

                {/* Promote/Demote Button */}
                {user.role !== 'admin' ? (
                  <button
                    onClick={() => handleUserAction('promote')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Promote to Admin
                  </button>
                ) : (
                  <button
                    onClick={() => handleUserAction('demote')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    Demote from Admin
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setConfirmAction(null)}
          />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Action
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {confirmAction.action === 'suspend' && 'Are you sure you want to suspend this user? They will not be able to access the platform.'}
                {confirmAction.action === 'unsuspend' && 'Are you sure you want to unsuspend this user? They will regain access to the platform.'}
                {confirmAction.action === 'promote' && 'Are you sure you want to promote this user to admin? They will have full administrative access.'}
                {confirmAction.action === 'demote' && 'Are you sure you want to demote this user from admin? They will lose administrative privileges.'}
              </p>

              <div className="mb-4">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  id="reason"
                  rows={3}
                  value={confirmAction.reason || ''}
                  onChange={(e) => setConfirmAction({ ...confirmAction, reason: e.target.value })}
                  placeholder="Enter reason for this action..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUserAction}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${
                    confirmAction.action === 'suspend' 
                      ? 'bg-red-600 hover:bg-red-700'
                      : confirmAction.action === 'promote'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : confirmAction.action === 'demote'
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {actionLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
