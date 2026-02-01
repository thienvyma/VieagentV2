'use client'

import { useState, useEffect } from 'react'
import { 
  ServerIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  CloudIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'

interface SystemHealth {
  service: string
  status: 'healthy' | 'warning' | 'critical' | 'down'
  uptime: number
  response_time: number
  last_check: string
  error_rate: number
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
}

interface SystemAlert {
  id: string
  severity: 'info' | 'warning' | 'critical'
  service: string
  message: string
  created_at: string
  resolved: boolean
}

interface ErrorLog {
  id: string
  service: string
  severity: 'error' | 'warning' | 'info' | 'debug'
  message: string
  stack_trace?: string
  endpoint?: string
  method?: string
  status_code?: number
  created_at: string
}

interface PerformanceHistory {
  timestamp: string
  cpu: number
  memory: number
  disk: number
  network: number
}

interface AlertThreshold {
  id: string
  metric: string
  warning_threshold: number
  critical_threshold: number
  enabled: boolean
}

export default function SystemMonitoringTab() {
  const [healthData, setHealthData] = useState<SystemHealth[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([])
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceHistory[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [alertThresholds, setAlertThresholds] = useState<AlertThreshold[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  // Filter states
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<string>('all')
  const [logSeverityFilter, setLogSeverityFilter] = useState<string>('all')
  const [logServiceFilter, setLogServiceFilter] = useState<string>('all')
  const [logSearchQuery, setLogSearchQuery] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('')
  
  // Threshold editing state
  const [editingThreshold, setEditingThreshold] = useState<AlertThreshold | null>(null)
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false)

  useEffect(() => {
    fetchSystemData()
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchSystemData()
      }, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setLogSearchQuery(searchInput)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchSystemData = async () => {
    try {
      // Fetch system health
      const healthResponse = await fetch('/api/admin?type=system_health')
      if (healthResponse.ok) {
        const healthDataResponse = await healthResponse.json()
        setHealthData(healthDataResponse.health || [])
      }

      // Fetch performance metrics
      const performanceResponse = await fetch('/api/admin?type=performance_metrics')
      if (performanceResponse.ok) {
        const performanceDataResponse = await performanceResponse.json()
        setPerformanceData(performanceDataResponse.metrics || [])
      }

      // Fetch performance history for charts
      const historyResponse = await fetch('/api/admin?type=performance_history&hours=24')
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setPerformanceHistory(historyData.history || [])
      }

      // Fetch system alerts
      const alertsResponse = await fetch('/api/admin?type=system_alerts&limit=50')
      if (alertsResponse.ok) {
        const alertsDataResponse = await alertsResponse.json()
        setAlerts(alertsDataResponse.alerts || [])
      }

      // Fetch error logs
      const logsResponse = await fetch('/api/admin?type=error_logs&limit=100')
      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setErrorLogs(logsData.logs || [])
      }

      // Fetch alert thresholds
      const thresholdsResponse = await fetch('/api/admin?type=alert_thresholds')
      if (thresholdsResponse.ok) {
        const thresholdsData = await thresholdsResponse.json()
        setAlertThresholds(thresholdsData.thresholds || [])
      }

      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to fetch system data:', error)
      toast.error('Failed to load system monitoring data')
    } finally {
      setIsLoading(false)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'resolve_alert',
          alertId
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to resolve alert')
      }

      toast.success('Alert resolved successfully')
      await fetchSystemData()
    } catch (error) {
      console.error('Error resolving alert:', error)
      toast.error('Failed to resolve alert')
    }
  }

  const exportSystemReport = async () => {
    try {
      // Prepare report data
      const reportData = {
        generated_at: new Date().toISOString(),
        system_health: healthData,
        performance_metrics: performanceData,
        alerts: alerts,
        error_logs: errorLogs.slice(0, 50) // Limit to 50 most recent
      }

      // Convert to CSV format
      const csvRows = []
      
      // Header
      csvRows.push('System Monitoring Report')
      csvRows.push(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`)
      csvRows.push('')
      
      // System Health
      csvRows.push('=== SYSTEM HEALTH ===')
      csvRows.push('Service,Status,Uptime %,Response Time (ms),Error Rate %')
      healthData.forEach(h => {
        csvRows.push(`${h.service},${h.status},${h.uptime},${h.response_time},${h.error_rate}`)
      })
      csvRows.push('')
      
      // Performance Metrics
      csvRows.push('=== PERFORMANCE METRICS ===')
      csvRows.push('Metric,Value,Unit,Status,Trend')
      performanceData.forEach(p => {
        csvRows.push(`${p.name},${p.value},${p.unit},${p.status},${p.trend}`)
      })
      csvRows.push('')
      
      // Active Alerts
      csvRows.push('=== ACTIVE ALERTS ===')
      csvRows.push('Severity,Service,Message,Created At,Resolved')
      alerts.filter(a => !a.resolved).forEach(a => {
        csvRows.push(`${a.severity},${a.service},"${a.message}",${a.created_at},${a.resolved}`)
      })
      csvRows.push('')
      
      // Recent Error Logs
      csvRows.push('=== RECENT ERROR LOGS ===')
      csvRows.push('Service,Severity,Message,Endpoint,Status Code,Created At')
      errorLogs.slice(0, 50).forEach(log => {
        csvRows.push(`${log.service},${log.severity},"${log.message}",${log.endpoint || 'N/A'},${log.status_code || 'N/A'},${log.created_at}`)
      })

      const csvContent = csvRows.join('\n')
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `system-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('System report exported successfully')
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Failed to export system report')
    }
  }

  const updateAlertThreshold = async (threshold: AlertThreshold) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_alert_threshold',
          threshold
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update threshold')
      }

      toast.success('Alert threshold updated successfully')
      setIsThresholdModalOpen(false)
      setEditingThreshold(null)
      await fetchSystemData()
    } catch (error) {
      console.error('Error updating threshold:', error)
      toast.error('Failed to update alert threshold')
    }
  }

  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'api gateway':
        return <ServerIcon className="h-6 w-6" />
      case 'database':
        return <CircleStackIcon className="h-6 w-6" />
      case 'authentication':
        return <ShieldCheckIcon className="h-6 w-6" />
      case 'webhooks':
        return <CloudIcon className="h-6 w-6" />
      case 'storage':
        return <CircleStackIcon className="h-6 w-6" />
      default:
        return <CpuChipIcon className="h-6 w-6" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'critical':
      case 'down':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return <CheckCircleIcon className="h-5 w-5" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'critical':
      case 'down':
        return <XCircleIcon className="h-5 w-5" />
      default:
        return <CheckCircleIcon className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.resolved)
  const systemStatus = healthData.every(service => service.status === 'healthy') ? 'healthy' : 
                     healthData.some(service => service.status === 'critical' || service.status === 'down') ? 'critical' : 'warning'

  // Filter alerts by severity
  const filteredAlerts = alerts.filter(alert => {
    if (alertSeverityFilter === 'all') return true
    return alert.severity === alertSeverityFilter
  })

  // Filter error logs
  const filteredErrorLogs = errorLogs.filter(log => {
    // Filter by severity
    if (logSeverityFilter !== 'all' && log.severity !== logSeverityFilter) return false
    
    // Filter by service
    if (logServiceFilter !== 'all' && log.service !== logServiceFilter) return false
    
    // Filter by search query
    if (logSearchQuery) {
      const query = logSearchQuery.toLowerCase()
      return (
        log.message.toLowerCase().includes(query) ||
        log.service.toLowerCase().includes(query) ||
        (log.endpoint && log.endpoint.toLowerCase().includes(query))
      )
    }
    
    return true
  })

  // Get unique services from error logs for filter
  const uniqueServices = Array.from(new Set(errorLogs.map(log => log.service)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Monitoring</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time system health and performance • Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportSystemReport}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
            Export Report
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
              autoRefresh
                ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700'
            }`}
          >
            {autoRefresh ? '⏸️ Pause' : '▶️ Resume'} Auto-refresh
          </button>
          <button
            onClick={fetchSystemData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="font-medium text-red-800 dark:text-red-400">
              {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} Require Immediate Attention
            </span>
          </div>
        </div>
      )}

      {/* System Status Overview */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Status</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemStatus)}`}>
            {getStatusIcon(systemStatus)}
            <span className="ml-2">{systemStatus.toUpperCase()}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {healthData.filter(s => s.status === 'healthy').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Services Online</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {healthData.length > 0 ? (healthData.reduce((acc, s) => acc + s.uptime, 0) / healthData.length).toFixed(1) : '0'}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Uptime</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {healthData.length > 0 ? Math.round(healthData.reduce((acc, s) => acc + s.response_time, 0) / healthData.length) : '0'}ms
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {alerts.filter(a => !a.resolved).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'services', name: 'Services' },
            { id: 'performance', name: 'Performance' },
            { id: 'alerts', name: `Alerts (${filteredAlerts.filter(a => !a.resolved).length})` },
            { id: 'logs', name: `Error Logs (${filteredErrorLogs.length})` },
            { id: 'thresholds', name: 'Alert Thresholds' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Health Summary */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Service Health</h3>
            </div>
            <div className="p-4 space-y-3">
              {healthData.slice(0, 6).map((service) => (
                <div key={service.service} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`${getStatusColor(service.status)} p-2 rounded-lg`}>
                      {getServiceIcon(service.service)}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{service.service}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{service.uptime.toFixed(1)}%</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Alerts</h3>
            </div>
            <div className="p-4 space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                        alert.severity === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
                        'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{alert.service}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="ml-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent alerts</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Service Status</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {healthData.map((service) => (
              <div key={service.service} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`${getStatusColor(service.status)} p-2 rounded-lg`}>
                      {getServiceIcon(service.service)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{service.service}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last check: {new Date(service.last_check).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                    {service.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{service.uptime.toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{service.response_time}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Error Rate:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{service.error_rate.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Charts */}
          {performanceHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Performance Trends (Last 24 Hours)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMM d, HH:mm')}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="CPU %" />
                  <Area type="monotone" dataKey="memory" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Memory %" />
                  <Area type="monotone" dataKey="disk" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Disk %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Current Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {performanceData.map((metric) => (
              <div key={metric.name} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{metric.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {metric.trend === 'up' ? '📈' : metric.trend === 'down' ? '📉' : '➡️'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                      {metric.status}
                    </span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {metric.value} {metric.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Alerts</h3>
              
              {/* Severity Filter */}
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={alertSeverityFilter}
                  onChange={(e) => setAlertSeverityFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                        alert.severity === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
                        'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">{alert.service}</span>
                      {alert.resolved && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                          Resolved
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{alert.message}</p>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Created: {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {filteredAlerts.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <CheckCircleIcon className="mx-auto h-12 w-12 mb-4" />
                <p>No alerts matching filter</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Logs Tab - Task 1.6.4 */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>

              {/* Severity Filter */}
              <select
                value={logSeverityFilter}
                onChange={(e) => setLogSeverityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Severities</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>

              {/* Service Filter */}
              <select
                value={logServiceFilter}
                onChange={(e) => setLogServiceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Services</option>
                {uniqueServices.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Logs List */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Error Logs ({filteredErrorLogs.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {filteredErrorLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.severity === 'error' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                        log.severity === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
                        log.severity === 'info' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                      }`}>
                        {log.severity}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">{log.service}</span>
                      {log.endpoint && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {log.method} {log.endpoint}
                        </span>
                      )}
                      {log.status_code && (
                        <span className={`text-sm font-mono ${
                          log.status_code >= 500 ? 'text-red-600 dark:text-red-400' :
                          log.status_code >= 400 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {log.status_code}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{log.message}</p>
                  
                  {log.stack_trace && (
                    <details className="mt-2">
                      <summary className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                        View stack trace
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                        <code className="text-gray-800 dark:text-gray-200">{log.stack_trace}</code>
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              
              {filteredErrorLogs.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <CheckCircleIcon className="mx-auto h-12 w-12 mb-4" />
                  <p>No error logs matching filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alert Thresholds Tab - Task 1.6.9 */}
      {activeTab === 'thresholds' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Alert Thresholds Configuration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Configure warning and critical thresholds for system metrics
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {alertThresholds.length > 0 ? (
                alertThresholds.map((threshold) => (
                  <div key={threshold.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{threshold.metric}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            threshold.enabled 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                          }`}>
                            {threshold.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Warning Threshold:</span>
                            <span className="ml-2 font-medium text-yellow-600 dark:text-yellow-400">
                              {threshold.warning_threshold}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Critical Threshold:</span>
                            <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                              {threshold.critical_threshold}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setEditingThreshold(threshold)
                          setIsThresholdModalOpen(true)
                        }}
                        className="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <ExclamationTriangleIcon className="mx-auto h-12 w-12 mb-4" />
                  <p>No alert thresholds configured</p>
                  <p className="text-sm mt-2">Default thresholds will be used</p>
                </div>
              )}
            </div>
          </div>

          {/* Default Thresholds Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Default Thresholds</h4>
            <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <p>• CPU Usage: Warning at 75%, Critical at 90%</p>
              <p>• Memory Usage: Warning at 80%, Critical at 95%</p>
              <p>• Disk Usage: Warning at 75%, Critical at 90%</p>
              <p>• Response Time: Warning at 500ms, Critical at 1000ms</p>
              <p>• Error Rate: Warning at 5%, Critical at 10%</p>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Edit Modal */}
      {isThresholdModalOpen && editingThreshold && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Edit Alert Threshold
                </h3>
                <button
                  onClick={() => {
                    setIsThresholdModalOpen(false)
                    setEditingThreshold(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Metric
                  </label>
                  <input
                    type="text"
                    value={editingThreshold.metric}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Warning Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingThreshold.warning_threshold}
                    onChange={(e) => setEditingThreshold({
                      ...editingThreshold,
                      warning_threshold: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Critical Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingThreshold.critical_threshold}
                    onChange={(e) => setEditingThreshold({
                      ...editingThreshold,
                      critical_threshold: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={editingThreshold.enabled}
                    onChange={(e) => setEditingThreshold({
                      ...editingThreshold,
                      enabled: e.target.checked
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Enable this threshold
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setIsThresholdModalOpen(false)
                      setEditingThreshold(null)
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateAlertThreshold(editingThreshold)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
