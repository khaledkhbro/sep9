"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileCheck, Settings, Save, Plus, Trash2, Edit, AlertCircle, CheckCircle, Clock, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VerificationSetting {
  id: number
  document_type: string
  display_name: string
  description: string
  enabled: boolean
  max_file_size_mb: number
  allowed_formats: string[]
  created_at: string
  updated_at: string
}

interface VerificationStats {
  total_requests: number
  pending_requests: number
  approved_requests: number
  rejected_requests: number
  verified_users: number
}

export default function VerificationSettingsPage() {
  const [settings, setSettings] = useState<VerificationSetting[]>([])
  const [stats, setStats] = useState<VerificationStats>({
    total_requests: 0,
    pending_requests: 0,
    approved_requests: 0,
    rejected_requests: 0,
    verified_users: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newSetting, setNewSetting] = useState({
    document_type: "",
    display_name: "",
    description: "",
    enabled: true,
    max_file_size_mb: 5,
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
    fetchStats()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/verification/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || [])
      }
    } catch (error) {
      console.error("Error fetching verification settings:", error)
      toast({
        title: "Error",
        description: "Failed to load verification settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/verification/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error("Error fetching verification stats:", error)
    }
  }

  const updateSetting = async (id: number, updates: Partial<VerificationSetting>) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/verification/settings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        await fetchSettings()
        toast({
          title: "Success",
          description: "Verification setting updated successfully",
        })
        setEditingId(null)
      } else {
        throw new Error("Failed to update setting")
      }
    } catch (error) {
      console.error("Error updating setting:", error)
      toast({
        title: "Error",
        description: "Failed to update verification setting",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const createSetting = async () => {
    if (!newSetting.document_type || !newSetting.display_name) {
      toast({
        title: "Error",
        description: "Document type and display name are required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/admin/verification/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSetting),
      })

      if (response.ok) {
        await fetchSettings()
        setNewSetting({
          document_type: "",
          display_name: "",
          description: "",
          enabled: true,
          max_file_size_mb: 5,
          allowed_formats: ["jpg", "jpeg", "png", "pdf"],
        })
        toast({
          title: "Success",
          description: "New verification setting created successfully",
        })
      } else {
        throw new Error("Failed to create setting")
      }
    } catch (error) {
      console.error("Error creating setting:", error)
      toast({
        title: "Error",
        description: "Failed to create verification setting",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteSetting = async (id: number) => {
    if (!confirm("Are you sure you want to delete this verification setting?")) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/verification/settings/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchSettings()
        toast({
          title: "Success",
          description: "Verification setting deleted successfully",
        })
      } else {
        throw new Error("Failed to delete setting")
      }
    } catch (error) {
      console.error("Error deleting setting:", error)
      toast({
        title: "Error",
        description: "Failed to delete verification setting",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verification Settings</h1>
          <p className="text-gray-600 mt-2">Manage document verification requirements and settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {stats.verified_users} Verified Users
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{stats.total_requests}</p>
              </div>
              <FileCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_requests}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved_requests}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected_requests}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Document Settings
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Type
          </TabsTrigger>
        </TabsList>

        {/* Document Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                Document Verification Settings
              </CardTitle>
              <CardDescription>Configure which document types users can submit for verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={setting.enabled}
                          onCheckedChange={(enabled) => updateSetting(setting.id, { enabled })}
                          disabled={saving}
                        />
                        <div>
                          <h3 className="font-medium">{setting.display_name}</h3>
                          <p className="text-sm text-gray-600">{setting.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={setting.enabled ? "default" : "secondary"}>
                          {setting.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(editingId === setting.id ? null : setting.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSetting(setting.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {editingId === setting.id && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <Label htmlFor={`display_name_${setting.id}`}>Display Name</Label>
                          <Input
                            id={`display_name_${setting.id}`}
                            value={setting.display_name}
                            onChange={(e) => {
                              const updated = settings.map((s) =>
                                s.id === setting.id ? { ...s, display_name: e.target.value } : s,
                              )
                              setSettings(updated)
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`max_size_${setting.id}`}>Max File Size (MB)</Label>
                          <Input
                            id={`max_size_${setting.id}`}
                            type="number"
                            value={setting.max_file_size_mb}
                            onChange={(e) => {
                              const updated = settings.map((s) =>
                                s.id === setting.id ? { ...s, max_file_size_mb: Number.parseInt(e.target.value) } : s,
                              )
                              setSettings(updated)
                            }}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor={`description_${setting.id}`}>Description</Label>
                          <Textarea
                            id={`description_${setting.id}`}
                            value={setting.description}
                            onChange={(e) => {
                              const updated = settings.map((s) =>
                                s.id === setting.id ? { ...s, description: e.target.value } : s,
                              )
                              setSettings(updated)
                            }}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Allowed Formats</Label>
                          <div className="flex gap-2 mt-2">
                            {setting.allowed_formats.map((format) => (
                              <Badge key={format} variant="outline">
                                {format.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="md:col-span-2 flex gap-2">
                          <Button
                            onClick={() =>
                              updateSetting(setting.id, {
                                display_name: setting.display_name,
                                description: setting.description,
                                max_file_size_mb: setting.max_file_size_mb,
                              })
                            }
                            disabled={saving}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add New Type Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                Add New Document Type
              </CardTitle>
              <CardDescription>Create a new document type for user verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="document_type">Document Type (Internal)</Label>
                  <Input
                    id="document_type"
                    placeholder="e.g., employee_id"
                    value={newSetting.document_type}
                    onChange={(e) => setNewSetting({ ...newSetting, document_type: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    placeholder="e.g., Employee ID Card"
                    value={newSetting.display_name}
                    onChange={(e) => setNewSetting({ ...newSetting, display_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_file_size">Max File Size (MB)</Label>
                  <Input
                    id="max_file_size"
                    type="number"
                    value={newSetting.max_file_size_mb}
                    onChange={(e) =>
                      setNewSetting({ ...newSetting, max_file_size_mb: Number.parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={newSetting.enabled}
                    onCheckedChange={(enabled) => setNewSetting({ ...newSetting, enabled })}
                  />
                  <Label htmlFor="enabled">Enable by default</Label>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this document type is for..."
                    value={newSetting.description}
                    onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={createSetting} disabled={saving}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Document Type
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
