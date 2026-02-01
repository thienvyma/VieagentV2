'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  Copy,
  Check
} from 'lucide-react'

interface WebhookTestingPanelProps {
  agentId: string
  webhookUrl: string
  requiredIntegrations?: any[]
}

interface TestResult {
  success: boolean
  status?: number
  statusText?: string
  responseTime: number
  response?: any
  error?: string
  headers?: Record<string, string>
}

export default function WebhookTestingPanel({
  agentId,
  webhookUrl,
  requiredIntegrations = []
}: WebhookTestingPanelProps) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [customPayload, setCustomPayload] = useState('')
  const [useCustomPayload, setUseCustomPayload] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateDefaultPayload = () => {
    const credentials: Record<string, string> = {}
    requiredIntegrations.forEach(ri => {
      credentials[ri.field_name] = `test_${ri.field_name}_value`
    })

    return {
      test: true,
      agent_id: agentId,
      user_id: 'test_user_id',
      execution_id: 'test_execution_id',
      timestamp: new Date().toISOString(),
      credentials,
      input: {
        message: 'This is a test execution',
        data: {
          example_field: 'example_value'
        }
      }
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      let payload
      if (useCustomPayload && customPayload) {
        try {
          payload = JSON.parse(customPayload)
        } catch (err) {
          setTestResult({
            success: false,
            error: 'Invalid JSON in custom payload',
            responseTime: 0
          })
          setTesting(false)
          return
        }
      } else {
        payload = generateDefaultPayload()
      }

      const response = await fetch(`/api/agents/${agentId}/test-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          test_payload: payload
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setTestResult(data.data)
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Test failed',
          responseTime: 0
        })
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Failed to test webhook',
        responseTime: 0
      })
    } finally {
      setTesting(false)
    }
  }

  const handleCopyPayload = () => {
    const payload = JSON.stringify(generateDefaultPayload(), null, 2)
    navigator.clipboard.writeText(payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const defaultPayload = generateDefaultPayload()

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Webhook Testing</h2>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-600">Webhook URL</Label>
            <div className="mt-1 p-3 bg-gray-50 rounded border font-mono text-sm break-all">
              {webhookUrl}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomPayload"
              checked={useCustomPayload}
              onChange={(e) => setUseCustomPayload(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="useCustomPayload" className="cursor-pointer">
              Use custom payload
            </Label>
          </div>

          {useCustomPayload ? (
            <div>
              <Label htmlFor="customPayload">Custom Payload (JSON)</Label>
              <Textarea
                id="customPayload"
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                placeholder={JSON.stringify(defaultPayload, null, 2)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Default Test Payload</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPayload}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
                {JSON.stringify(defaultPayload, null, 2)}
              </pre>
            </div>
          )}

          <Button
            onClick={handleTest}
            disabled={testing || !webhookUrl}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Send Test Request
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Test Results</h3>

          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-3">
              {testResult.success ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <div>
                    <div className="font-medium text-green-700">Success</div>
                    <div className="text-sm text-gray-600">
                      {testResult.status} {testResult.statusText}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <div>
                    <div className="font-medium text-red-700">Failed</div>
                    <div className="text-sm text-gray-600">
                      {testResult.error || 'Unknown error'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Response Time */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Response Time:</span>
              <span className="font-medium">{testResult.responseTime}ms</span>
            </div>

            {/* Response Body */}
            {testResult.response && (
              <div>
                <Label className="text-sm text-gray-600 mb-2 block">Response Body</Label>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96">
                  {typeof testResult.response === 'string'
                    ? testResult.response
                    : JSON.stringify(testResult.response, null, 2)}
                </pre>
              </div>
            )}

            {/* Response Headers */}
            {testResult.headers && Object.keys(testResult.headers).length > 0 && (
              <div>
                <Label className="text-sm text-gray-600 mb-2 block">Response Headers</Label>
                <div className="bg-gray-50 p-4 rounded text-sm space-y-1">
                  {Object.entries(testResult.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-gray-600 font-mono">{key}:</span>
                      <span className="text-gray-800 font-mono break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Testing Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Your webhook should respond within 10 seconds</li>
          <li>Return a 200 status code for successful execution</li>
          <li>Return JSON response with execution results</li>
          <li>Handle errors gracefully and return appropriate error messages</li>
          <li>Test with different payloads to ensure robustness</li>
        </ul>
      </Card>

      {/* Expected Response Format */}
      <Card className="p-6">
        <h3 className="font-medium mb-2">Expected Response Format</h3>
        <p className="text-sm text-gray-600 mb-3">
          Your webhook should return a JSON response like this:
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "data": {
    // Your execution results
  },
  "message": "Execution completed successfully",
  "execution_time_ms": 1234
}`}
        </pre>
      </Card>
    </div>
  )
}
