'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  CheckCircle2, 
  Circle, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Rocket,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface AgentCreationWizardProps {
  onComplete: (agent: any) => void
  onCancel: () => void
  editMode?: boolean
  existingAgent?: any
}

interface FormData {
  // Step 1: Basic Information
  name: string
  description: string
  category: string
  use_case: string
  tags: string[]
  cover_image: string | null
  
  // Step 2: Integration Requirements
  required_integrations: {
    integration_id: string
    field_name: string
    instructions: string
    required: boolean
  }[]
  
  // Step 3: Pricing
  price_one_time: number | null
  price_monthly: number | null
  
  // Step 4: Webhook
  webhook_url: string
  webhook_test_result: 'pending' | 'success' | 'failed' | null
}

const STEPS = [
  { number: 1, title: 'Basic Information', description: 'Name, description, and category' },
  { number: 2, title: 'Integrations', description: 'Required integrations' },
  { number: 3, title: 'Pricing', description: 'Set your pricing' },
  { number: 4, title: 'Webhook', description: 'Configure webhook' },
  { number: 5, title: 'Review', description: 'Review and publish' }
]

const CATEGORIES = [
  'automation',
  'data-processing',
  'communication',
  'analytics',
  'productivity',
  'marketing',
  'sales',
  'customer-support',
  'development',
  'other'
]

export default function AgentCreationWizard({
  onComplete,
  onCancel,
  editMode = false,
  existingAgent
}: AgentCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    name: existingAgent?.name || '',
    description: existingAgent?.description || '',
    category: existingAgent?.category || '',
    use_case: existingAgent?.use_case || '',
    tags: existingAgent?.tags || [],
    cover_image: existingAgent?.cover_image || null,
    required_integrations: existingAgent?.required_integrations || [],
    price_one_time: existingAgent?.price_one_time || null,
    price_monthly: existingAgent?.price_monthly || null,
    webhook_url: existingAgent?.webhook_url || '',
    webhook_test_result: null
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [integrations, setIntegrations] = useState<any[]>([])
  const [tagInput, setTagInput] = useState('')

  // Fetch available integrations
  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations || [])
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Agent name is required'
      }
      if (formData.description.length < 50) {
        newErrors.description = 'Description must be at least 50 characters'
      }
      if (!formData.category) {
        newErrors.category = 'Category is required'
      }
      if (!formData.use_case.trim()) {
        newErrors.use_case = 'Use case is required'
      }
      if (formData.tags.length === 0) {
        newErrors.tags = 'At least one tag is required'
      }
    }

    if (step === 2) {
      if (formData.required_integrations.length === 0) {
        newErrors.integrations = 'At least one integration is required'
      }
    }

    if (step === 3) {
      if (!formData.price_one_time && !formData.price_monthly) {
        newErrors.pricing = 'At least one pricing option is required'
      }
      if (formData.price_one_time && formData.price_one_time < 0) {
        newErrors.price_one_time = 'Price must be positive'
      }
      if (formData.price_monthly && formData.price_monthly < 0) {
        newErrors.price_monthly = 'Price must be positive'
      }
    }

    if (step === 4) {
      if (!formData.webhook_url.trim()) {
        newErrors.webhook_url = 'Webhook URL is required'
      } else if (!formData.webhook_url.startsWith('https://')) {
        newErrors.webhook_url = 'Webhook URL must use HTTPS'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleTestWebhook = async () => {
    setTesting(true)
    try {
      const response = await fetch(`/api/agents/${existingAgent?.id || 'test'}/test-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: formData.webhook_url
        })
      })

      const data = await response.json()
      
      if (data.success && data.data.success) {
        setFormData(prev => ({ ...prev, webhook_test_result: 'success' }))
      } else {
        setFormData(prev => ({ ...prev, webhook_test_result: 'failed' }))
      }
    } catch (error) {
      setFormData(prev => ({ ...prev, webhook_test_result: 'failed' }))
    } finally {
      setTesting(false)
    }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      const endpoint = editMode && existingAgent
        ? `/api/agents/${existingAgent.id}`
        : '/api/agents'
      
      const method = editMode ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          published: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        onComplete(data.agent)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save draft')
      }
    } catch (error) {
      console.error('Failed to save draft:', error)
      alert('Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!validateStep(currentStep)) return

    setSaving(true)
    try {
      const endpoint = editMode && existingAgent
        ? `/api/agents/${existingAgent.id}`
        : '/api/agents'
      
      const method = editMode ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          published: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        onComplete(data.agent)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to publish agent')
      }
    } catch (error) {
      console.error('Failed to publish agent:', error)
      alert('Failed to publish agent')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${currentStep > step.number ? 'bg-green-500 text-white' : 
                    currentStep === step.number ? 'bg-blue-500 text-white' : 
                    'bg-gray-200 text-gray-500'}
                `}>
                  {currentStep > step.number ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-4 ${
                  currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Basic Information</h2>
            
            <div>
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Awesome Agent"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description * (min 50 characters)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what your agent does..."
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.description.length} / 50 characters
              </p>
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border rounded-md p-2"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-sm text-red-500 mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <Label htmlFor="use_case">Use Case *</Label>
              <Textarea
                id="use_case"
                value={formData.use_case}
                onChange={(e) => setFormData(prev => ({ ...prev, use_case: e.target.value }))}
                placeholder="What problem does this agent solve?"
                rows={3}
              />
              {errors.use_case && (
                <p className="text-sm text-red-500 mt-1">{errors.use_case}</p>
              )}
            </div>

            <div>
              <Label>Tags * (at least 1)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag"
                />
                <Button type="button" onClick={handleAddTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {errors.tags && (
                <p className="text-sm text-red-500 mt-1">{errors.tags}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cover_image">Cover Image URL (optional)</Label>
              <Input
                id="cover_image"
                value={formData.cover_image || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cover_image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        )}

        {/* Step 2: Integration Requirements */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Integration Requirements</h2>
            <p className="text-gray-600 mb-4">
              Select the integrations your agent needs to function. Users will need to connect these before using your agent.
            </p>

            <div className="space-y-3">
              {integrations.map(integration => {
                const isSelected = formData.required_integrations.some(
                  ri => ri.integration_id === integration.id
                )
                
                return (
                  <div key={integration.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              required_integrations: [
                                ...prev.required_integrations,
                                {
                                  integration_id: integration.id,
                                  field_name: integration.name.toLowerCase().replace(/\s+/g, '_'),
                                  instructions: '',
                                  required: true
                                }
                              ]
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              required_integrations: prev.required_integrations.filter(
                                ri => ri.integration_id !== integration.id
                              )
                            }))
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {integration.logo_url && (
                            <img src={integration.logo_url} alt="" className="w-6 h-6" />
                          )}
                          <h3 className="font-medium">{integration.name}</h3>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {integration.auth_method}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                        
                        {isSelected && (
                          <div className="mt-3 space-y-2">
                            <div>
                              <Label className="text-sm">Field Name</Label>
                              <Input
                                value={
                                  formData.required_integrations.find(
                                    ri => ri.integration_id === integration.id
                                  )?.field_name || ''
                                }
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    required_integrations: prev.required_integrations.map(ri =>
                                      ri.integration_id === integration.id
                                        ? { ...ri, field_name: e.target.value }
                                        : ri
                                    )
                                  }))
                                }}
                                placeholder="e.g., slack_token"
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Setup Instructions</Label>
                              <Textarea
                                value={
                                  formData.required_integrations.find(
                                    ri => ri.integration_id === integration.id
                                  )?.instructions || ''
                                }
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    required_integrations: prev.required_integrations.map(ri =>
                                      ri.integration_id === integration.id
                                        ? { ...ri, instructions: e.target.value }
                                        : ri
                                    )
                                  }))
                                }}
                                placeholder="Tell users how to get their credentials..."
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {errors.integrations && (
              <p className="text-sm text-red-500">{errors.integrations}</p>
            )}
          </div>
        )}

        {/* Step 3: Pricing Configuration */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Pricing Configuration</h2>
            <p className="text-gray-600 mb-4">
              Set your pricing. You can offer one-time purchase, monthly subscription, or both.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">One-Time Purchase</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Users pay once and own the agent forever
                </p>
                <div>
                  <Label htmlFor="price_one_time">Price (USD)</Label>
                  <Input
                    id="price_one_time"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_one_time || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      price_one_time: e.target.value ? parseFloat(e.target.value) : null
                    }))}
                    placeholder="9.99"
                  />
                  {errors.price_one_time && (
                    <p className="text-sm text-red-500 mt-1">{errors.price_one_time}</p>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Monthly Subscription</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Users pay monthly to use the agent
                </p>
                <div>
                  <Label htmlFor="price_monthly">Price (USD/month)</Label>
                  <Input
                    id="price_monthly"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_monthly || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      price_monthly: e.target.value ? parseFloat(e.target.value) : null
                    }))}
                    placeholder="4.99"
                  />
                  {errors.price_monthly && (
                    <p className="text-sm text-red-500 mt-1">{errors.price_monthly}</p>
                  )}
                </div>
              </div>
            </div>

            {errors.pricing && (
              <p className="text-sm text-red-500">{errors.pricing}</p>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h4 className="font-medium text-blue-900 mb-2">Revenue Share</h4>
              <p className="text-sm text-blue-800">
                You receive 70% of all sales. AgentFlow takes 30% to cover platform costs.
              </p>
              {(formData.price_one_time || formData.price_monthly) && (
                <div className="mt-3 text-sm">
                  {formData.price_one_time && (
                    <div className="flex justify-between">
                      <span>One-time: ${formData.price_one_time.toFixed(2)}</span>
                      <span className="font-medium">
                        You earn: ${(formData.price_one_time * 0.7).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {formData.price_monthly && (
                    <div className="flex justify-between mt-1">
                      <span>Monthly: ${formData.price_monthly.toFixed(2)}</span>
                      <span className="font-medium">
                        You earn: ${(formData.price_monthly * 0.7).toFixed(2)}/month
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Webhook Setup */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Webhook Setup</h2>
            <p className="text-gray-600 mb-4">
              Your webhook will receive execution requests when users run your agent.
            </p>

            <div>
              <Label htmlFor="webhook_url">Webhook URL * (HTTPS only)</Label>
              <Input
                id="webhook_url"
                value={formData.webhook_url}
                onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                placeholder="https://your-server.com/webhook"
              />
              {errors.webhook_url && (
                <p className="text-sm text-red-500 mt-1">{errors.webhook_url}</p>
              )}
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium mb-2">Test Your Webhook</h3>
              <p className="text-sm text-gray-600 mb-3">
                Send a test request to verify your webhook is working correctly.
              </p>
              <Button
                onClick={handleTestWebhook}
                disabled={!formData.webhook_url || testing}
                variant="outline"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Webhook'
                )}
              </Button>

              {formData.webhook_test_result === 'success' && (
                <div className="mt-3 flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm">Webhook test successful!</span>
                </div>
              )}

              {formData.webhook_test_result === 'failed' && (
                <div className="mt-3 flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">Webhook test failed. Please check your URL and try again.</span>
                </div>
              )}
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Example Webhook Payload</h3>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "agent_id": "uuid",
  "user_id": "uuid",
  "execution_id": "uuid",
  "timestamp": "2024-01-28T10:00:00Z",
  "credentials": {
    ${formData.required_integrations.map(ri => `"${ri.field_name}": "user_credential_value"`).join(',\n    ')}
  },
  "input": {
    // User-provided input parameters
  }
}`}
              </pre>
            </div>
          </div>
        )}

        {/* Step 5: Review and Publish */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Review and Publish</h2>
            <p className="text-gray-600 mb-4">
              Review your agent configuration before publishing.
            </p>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Basic Information</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Name:</dt>
                    <dd className="font-medium">{formData.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Category:</dt>
                    <dd className="font-medium">{formData.category}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 mb-1">Description:</dt>
                    <dd className="text-gray-800">{formData.description}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 mb-1">Tags:</dt>
                    <dd className="flex flex-wrap gap-1">
                      {formData.tags.map(tag => (
                        <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Integrations</h3>
                <p className="text-sm text-gray-600">
                  {formData.required_integrations.length} integration(s) required
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Pricing</h3>
                <dl className="space-y-1 text-sm">
                  {formData.price_one_time && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">One-time:</dt>
                      <dd className="font-medium">${formData.price_one_time.toFixed(2)}</dd>
                    </div>
                  )}
                  {formData.price_monthly && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Monthly:</dt>
                      <dd className="font-medium">${formData.price_monthly.toFixed(2)}/month</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Webhook</h3>
                <p className="text-sm text-gray-600 break-all">{formData.webhook_url}</p>
                {formData.webhook_test_result === 'success' && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tested successfully</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            {currentStep < 5 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Draft
                </Button>
                <Button onClick={handlePublish} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                  Publish
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
