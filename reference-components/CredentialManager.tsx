'use client'

import { useState, useEffect } from 'react'
import { 
  TrashIcon, 
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import IntegrationTestingPanel from './IntegrationTestingPanel'

interface Credential {
  id: string
  integration_id: string
  key_name: string
  expires_at: string | null
  created_at: string
  updated_at: string
  integrations: {
    name: string
    auth_method: string
    logo_url: string | null
  }
}

interface CredentialManagerProps {
  userId: string
  onUpdate?: () => void
}

export default function CredentialManager({ userId, onUpdate }: CredentialManagerProps) {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Edit modal state
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  
  // Delete modal state
  const [deletingCredential, setDeletingCredential] = useState<Credential | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Testing modal state
  const [testingCredential, setTestingCredential] = useState<Credential | null>(null)

  useEffect(() => {
    fetchCredentials()
  }, [userId])

  const fetchCredentials = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/credentials')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch credentials')
      }

      setCredentials(data.credentials || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (credential: Credential) => {
    setEditingCredential(credential)
    setEditValue('')
  }

  const handleSaveEdit = async () => {
    if (!editingCredential || !editValue.trim()) {
      return
    }

    try {
      setEditLoading(true)

      // Test the new credential first
      const testResponse = await fetch('/api/credentials/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId: editingCredential.integration_id,
          apiKey: editValue
        })
      })

      const testResult = await testResponse.json()

      if (!testResult.success) {
        throw new Error(testResult.error || 'Credential test failed')
      }

      // Save the updated credential
      const saveResponse = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId: editingCredential.integration_id,
          keyName: editingCredential.key_name,
          value: editValue
        })
      })

      const saveResult = await saveResponse.json()

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save credential')
      }

      // Refresh credentials list
      await fetchCredentials()
      setEditingCredential(null)
      setEditValue('')
      
      if (onUpdate) {
        onUpdate()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update credential')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = (credential: Credential) => {
    setDeletingCredential(credential)
  }

  const confirmDelete = async () => {
    if (!deletingCredential) return

    try {
      setDeleteLoading(true)

      const response = await fetch(`/api/credentials?id=${deletingCredential.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete credential')
      }

      // Refresh credentials list
      await fetchCredentials()
      setDeletingCredential(null)
      
      if (onUpdate) {
        onUpdate()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete credential')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleTestConnection = async (credential: Credential) => {
    setTestingCredential(credential)
  }

  const handleRefreshToken = async (credentialId: string) => {
    try {
      // Call refresh token API
      const response = await fetch('/api/oauth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to refresh token')
      }

      // Refresh credentials list
      await fetchCredentials()
    } catch (err) {
      throw err
    }
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <Button onClick={fetchCredentials} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  if (credentials.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No credentials configured yet.</p>
        <p className="text-sm text-gray-500 mt-1">
          Credentials will appear here after you connect integrations.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Connected Integrations
        </h3>
        <Button onClick={fetchCredentials} variant="outline" size="sm">
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {credentials.map((credential) => (
          <Card key={credential.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {credential.integrations.logo_url ? (
                  <img
                    src={credential.integrations.logo_url}
                    alt={credential.integrations.name}
                    className="w-10 h-10 rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {credential.integrations.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">
                      {credential.integrations.name}
                    </h4>
                    {isExpired(credential.expires_at) ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {credential.key_name}
                  </p>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Connected {new Date(credential.created_at).toLocaleDateString()}
                  </p>
                  
                  {credential.expires_at && (
                    <p className="text-xs text-gray-500">
                      Expires {new Date(credential.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleTestConnection(credential)}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <BeakerIcon className="w-4 h-4" />
                </Button>
                
                {credential.integrations.auth_method === 'api_key' && (
                  <Button
                    onClick={() => handleEdit(credential)}
                    variant="outline"
                    size="sm"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  onClick={() => handleDelete(credential)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Credential Modal */}
      <Dialog open={!!editingCredential} onOpenChange={() => setEditingCredential(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Credential</DialogTitle>
            <DialogDescription>
              Enter the new credential value for {editingCredential?.integrations.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-value">New Value</Label>
              <Input
                id="edit-value"
                type="password"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter new credential value"
                disabled={editLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingCredential(null)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editLoading || !editValue.trim()}
            >
              {editLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingCredential} onOpenChange={() => setDeletingCredential(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Credential</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the credential for {deletingCredential?.integrations.name}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Agents using this integration will stop working until you reconnect.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCredential(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Credential'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Testing Modal */}
      <Dialog open={!!testingCredential} onOpenChange={() => setTestingCredential(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Connection - {testingCredential?.integrations.name}</DialogTitle>
            <DialogDescription>
              Test your integration connection and view troubleshooting tips
            </DialogDescription>
          </DialogHeader>

          {testingCredential && (
            <IntegrationTestingPanel 
              credential={testingCredential}
              onRefreshToken={handleRefreshToken}
            />
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestingCredential(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
