'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  X,
  PlayCircle
} from 'lucide-react'

interface ExecutionLog {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
}

interface ExecutionStatusPanelProps {
  executionId: string
  onCancel?: () => void
  onRetry?: () => void
  autoRefresh?: boolean
  refreshInterval?: number
}

type ExecutionStatus = 'pending' | 'queued' | 'running' | 'success' | 'failed' | 'cancelled' | 'timeout'

export default function ExecutionStatusPanel({
  executionId,
  onCancel,
  onRetry,
  autoRefresh = true,
  refreshInterval = 2000
}: ExecutionStatusPanelProps) {
  const [status, setStatus] = useState<ExecutionStatus>('pending')
  const [progress, setProgress] = useState(0)
  const [executionTime, setExecutionTime] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch execution status
  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/executions/${executionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch execution status')
      }

      const data = await response.json()

      if (data.success) {
        const execution = data.data
        
        setStatus(execution.status)
        setStartTime(execution.started_at ? new Date(execution.started_at) : null)
        setEndTime(execution.completed_at ? new Date(execution.completed_at) : null)
        setError(execution.error_message)
        setOutput(execution.output_payload)
        
        // Calculate execution time
        if (execution.execution_time_ms) {
          setExecutionTime(execution.execution_time_ms)
        } else if (execution.started_at) {
          const start = new Date(execution.started_at).getTime()
          const end = execution.completed_at 
            ? new Date(execution.completed_at).getTime() 
            : Date.now()
          setExecutionTime(end - start)
        }

        // Update progress based on status
        switch (execution.status) {
          case 'pending':
            setProgress(10)
            break
          case 'queued':
            setProgress(25)
            break
          case 'running':
            setProgress(50)
            break
          case 'success':
          case 'failed':
          case 'cancelled':
          case 'timeout':
            setProgress(100)
            break
        }

        // Add logs if available
        if (execution.logs && Array.isArray(execution.logs)) {
          setLogs(execution.logs)
        }
      }
    } catch (err: any) {
      console.error('Error fetching execution status:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh
  useEffect(() => {
    fetchStatus()

    if (autoRefresh && !['success', 'failed', 'cancelled', 'timeout'].includes(status)) {
      const interval = setInterval(fetchStatus, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [executionId, status, autoRefresh, refreshInterval])

  // Format execution time
  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(0)
    return `${minutes}m ${seconds}s`
  }

  // Get status badge
  const getStatusBadge = () => {
    const badges = {
      pending: { icon: Clock, color: 'bg-gray-500', text: 'Pending' },
      queued: { icon: Clock, color: 'bg-blue-500', text: 'Queued' },
      running: { icon: Loader2, color: 'bg-yellow-500', text: 'Running' },
      success: { icon: CheckCircle2, color: 'bg-green-500', text: 'Success' },
      failed: { icon: XCircle, color: 'bg-red-500', text: 'Failed' },
      cancelled: { icon: X, color: 'bg-gray-500', text: 'Cancelled' },
      timeout: { icon: AlertCircle, color: 'bg-orange-500', text: 'Timeout' }
    }

    const badge = badges[status] || badges.pending
    const Icon = badge.icon

    return (
      <Badge className={`${badge.color} text-white`}>
        <Icon className={`h-4 w-4 mr-1 ${status === 'running' ? 'animate-spin' : ''}`} />
        {badge.text}
      </Badge>
    )
  }

  // Get log level color
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'success':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading execution status...</span>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Execution Status</h2>
            {getStatusBadge()}
          </div>
          
          <div className="flex gap-2">
            {status === 'running' && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
            
            {['failed', 'timeout', 'cancelled'].includes(status) && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {['pending', 'queued', 'running'].includes(status) && (
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-600 mt-2">
              {status === 'pending' && 'Initializing execution...'}
              {status === 'queued' && 'Waiting in queue...'}
              {status === 'running' && 'Executing agent...'}
            </p>
          </div>
        )}

        {/* Execution Time */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Execution Time:</span>
            <span className="font-semibold">{formatExecutionTime(executionTime)}</span>
          </div>

          {startTime && (
            <div className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Started:</span>
              <span className="font-semibold">
                {startTime.toLocaleTimeString()}
              </span>
            </div>
          )}

          {endTime && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Completed:</span>
              <span className="font-semibold">
                {endTime.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Execution Logs */}
      {logs.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Execution Logs</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-3 text-sm p-2 hover:bg-gray-50 rounded"
              >
                <span className="text-gray-400 font-mono text-xs whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`font-semibold uppercase text-xs ${getLogLevelColor(log.level)}`}>
                  {log.level}
                </span>
                <span className="text-gray-700 flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Real-time Updates Indicator */}
      {autoRefresh && ['pending', 'queued', 'running'].includes(status) && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Auto-refreshing every {refreshInterval / 1000}s...</span>
        </div>
      )}
    </div>
  )
}
