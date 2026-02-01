'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Save, Upload, Clock, Calendar } from 'lucide-react'

interface FormField {
  name: string
  type: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'select' | 'date' | 'datetime' | 'file'
  label: string
  placeholder?: string
  required?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: string[]
  }
  example?: string
  description?: string
}

interface DynamicFormBuilderProps {
  agentId: string
  fields: FormField[]
  onSubmit: (data: Record<string, any>) => void
  onSaveTemplate?: (data: Record<string, any>, templateName: string) => void
  savedTemplates?: Array<{ name: string; data: Record<string, any> }>
  isLoading?: boolean
}

export default function DynamicFormBuilder({
  agentId,
  fields,
  onSubmit,
  onSaveTemplate,
  savedTemplates = [],
  isLoading = false
}: DynamicFormBuilderProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  // Initialize form data with empty values
  useEffect(() => {
    const initialData: Record<string, any> = {}
    fields.forEach(field => {
      initialData[field.name] = ''
    })
    setFormData(initialData)
  }, [fields])

  // Load template
  const handleLoadTemplate = (templateName: string) => {
    const template = savedTemplates.find(t => t.name === templateName)
    if (template) {
      setFormData(template.data)
      setSelectedTemplate(templateName)
      setErrors({})
    }
  }

  // Validate field
  const validateField = (field: FormField, value: any): string | null => {
    // Required validation
    if (field.required && (!value || value === '')) {
      return `${field.label} is required`
    }

    // Type-specific validation
    if (value && value !== '') {
      switch (field.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            return 'Invalid email format'
          }
          break

        case 'url':
          try {
            new URL(value)
          } catch {
            return 'Invalid URL format'
          }
          break

        case 'number':
          const num = Number(value)
          if (isNaN(num)) {
            return 'Must be a valid number'
          }
          if (field.validation?.min !== undefined && num < field.validation.min) {
            return `Must be at least ${field.validation.min}`
          }
          if (field.validation?.max !== undefined && num > field.validation.max) {
            return `Must be at most ${field.validation.max}`
          }
          break
      }

      // Pattern validation
      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern)
        if (!regex.test(value)) {
          return 'Invalid format'
        }
      }
    }

    return null
  }

  // Handle field change
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  // Handle file upload
  const handleFileUpload = async (fieldName: string, file: File) => {
    // Convert file to base64 or upload to storage
    const reader = new FileReader()
    reader.onloadend = () => {
      handleFieldChange(fieldName, {
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result
      })
    }
    reader.readAsDataURL(file)
  }

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    fields.forEach(field => {
      const error = validateField(field, formData[field.name])
      if (error) {
        newErrors[field.name] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  // Handle save template
  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    if (onSaveTemplate) {
      onSaveTemplate(formData, templateName)
      setShowSaveTemplate(false)
      setTemplateName('')
    }
  }

  // Render field based on type
  const renderField = (field: FormField) => {
    const value = formData[field.name] || ''
    const error = errors[field.name]

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.example}
            className={error ? 'border-red-500' : ''}
            rows={4}
          />
        )

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => handleFieldChange(field.name, val)}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.validation?.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'file':
        return (
          <div className="space-y-2">
            <Input
              id={field.name}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleFileUpload(field.name, file)
                }
              }}
              className={error ? 'border-red-500' : ''}
            />
            {value && typeof value === 'object' && (
              <p className="text-sm text-gray-600">
                Selected: {value.name} ({(value.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        )

      case 'date':
        return (
          <div className="relative">
            <Input
              id={field.name}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        )

      case 'datetime':
        return (
          <div className="relative">
            <Input
              id={field.name}
              type="datetime-local"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            <Clock className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        )

      default:
        return (
          <Input
            id={field.name}
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.example}
            className={error ? 'border-red-500' : ''}
          />
        )
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Template Selection */}
        {savedTemplates.length > 0 && (
          <div className="space-y-2">
            <Label>Load Saved Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={handleLoadTemplate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {savedTemplates.map(template => (
                  <SelectItem key={template.name} value={template.name}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Dynamic Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {renderField(field)}
              
              {/* Field Description */}
              {field.description && (
                <p className="text-sm text-gray-600">{field.description}</p>
              )}
              
              {/* Example */}
              {field.example && !field.description && (
                <p className="text-sm text-gray-500">
                  Example: {field.example}
                </p>
              )}
              
              {/* Error Message */}
              {errors[field.name] && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors[field.name]}</span>
                </div>
              )}
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Executing...' : 'Execute Agent'}
            </Button>

            {onSaveTemplate && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSaveTemplate(true)}
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            )}
          </div>
        </form>

        {/* Save Template Dialog */}
        {showSaveTemplate && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-3">Save as Template</h3>
            <div className="space-y-3">
              <Input
                placeholder="Template name..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveTemplate} size="sm">
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSaveTemplate(false)
                    setTemplateName('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
