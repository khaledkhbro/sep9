"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MessageSquare, Plus, Edit, Settings, Clock, Send, Bot, Timer, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AutomatedTemplate {
  id: number
  name: string
  type: string
  trigger_condition: string
  message_content: string
  is_active: boolean
  priority: number
  delay_seconds: number
  variables: Record<string, any>
}

interface AutomationSettings {
  welcome_message_enabled: boolean
  proactive_messages_enabled: boolean
  business_hours_start: string
  business_hours_end: string
  business_days: string[]
  idle_timeout_minutes: number
  no_response_timeout_minutes: number
  max_proactive_messages: number
  auto_close_timeout_minutes: number
}

export default function ChatAutomationPage() {
  const [templates, setTemplates] = useState<AutomatedTemplate[]>([])
  const [settings, setSettings] = useState<AutomationSettings>({
    welcome_message_enabled: true,
    proactive_messages_enabled: true,
    business_hours_start: "09:00",
    business_hours_end: "18:00",
    business_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    idle_timeout_minutes: 5,
    no_response_timeout_minutes: 10,
    max_proactive_messages: 3,
    auto_close_timeout_minutes: 30,
  })
  const [loading, setLoading] = useState(true)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<AutomatedTemplate | null>(null)
  const [testSessionId, setTestSessionId] = useState("")

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    type: "welcome",
    trigger_condition: "session_start",
    message_content: "",
    delay_seconds: 0,
    priority: 1,
    variables: "{}",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Load from localStorage for demo
      const storedTemplates = localStorage.getItem("chat-automation-templates")
      const storedSettings = localStorage.getItem("chat-automation-settings")

      if (storedTemplates) {
        setTemplates(JSON.parse(storedTemplates))
      } else {
        const defaultTemplates: AutomatedTemplate[] = [
          {
            id: 1,
            name: "Welcome Message",
            type: "welcome",
            trigger_condition: "session_start",
            message_content: "Hello! 👋 Welcome to our support chat. How can we help you today?",
            is_active: true,
            priority: 1,
            delay_seconds: 2,
            variables: {},
          },
          {
            id: 2,
            name: "Idle Follow-up",
            type: "proactive",
            trigger_condition: "idle_5min",
            message_content: "Are you still there? If you need any assistance, feel free to ask!",
            is_active: true,
            priority: 2,
            delay_seconds: 0,
            variables: {},
          },
          {
            id: 3,
            name: "Business Hours Notice",
            type: "proactive",
            trigger_condition: "outside_hours",
            message_content:
              "Thanks for reaching out! Our team is currently offline, but we'll respond as soon as possible during business hours (9 AM - 6 PM EST).",
            is_active: true,
            priority: 1,
            delay_seconds: 5,
            variables: {},
          },
          {
            id: 4,
            name: "Queue Position Update",
            type: "proactive",
            trigger_condition: "queue_position",
            message_content:
              "You are currently #{{position}} in the queue. Average wait time is {{wait_time}} minutes.",
            is_active: false,
            priority: 3,
            delay_seconds: 0,
            variables: { position: 1, wait_time: 3 },
          },
        ]
        setTemplates(defaultTemplates)
        localStorage.setItem("chat-automation-templates", JSON.stringify(defaultTemplates))
      }

      if (storedSettings) {
        setSettings(JSON.parse(storedSettings))
      } else {
        localStorage.setItem("chat-automation-settings", JSON.stringify(settings))
      }
    } catch (error) {
      console.error("Failed to fetch automation data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = () => {
    localStorage.setItem("chat-automation-settings", JSON.stringify(settings))
    alert("Settings saved successfully!")
  }

  const handleToggleTemplate = (templateId: number, field: string, value: boolean) => {
    const updatedTemplates = templates.map((template) =>
      template.id === templateId ? { ...template, [field]: value } : template,
    )
    setTemplates(updatedTemplates)
    localStorage.setItem("chat-automation-templates", JSON.stringify(updatedTemplates))
  }

  const handleAddTemplate = () => {
    const template: AutomatedTemplate = {
      id: Math.max(...templates.map((t) => t.id), 0) + 1,
      name: newTemplate.name,
      type: newTemplate.type,
      trigger_condition: newTemplate.trigger_condition,
      message_content: newTemplate.message_content,
      is_active: true,
      priority: newTemplate.priority,
      delay_seconds: newTemplate.delay_seconds,
      variables: JSON.parse(newTemplate.variables || "{}"),
    }

    const updatedTemplates = [...templates, template]
    setTemplates(updatedTemplates)
    localStorage.setItem("chat-automation-templates", JSON.stringify(updatedTemplates))

    setNewTemplate({
      name: "",
      type: "welcome",
      trigger_condition: "session_start",
      message_content: "",
      delay_seconds: 0,
      priority: 1,
      variables: "{}",
    })
    setShowTemplateDialog(false)
  }

  const handleTestTemplate = async (templateId: number) => {
    if (!testSessionId) {
      alert("Please enter a test session ID")
      return
    }

    try {
      const response = await fetch("/api/chat/anonymous/automated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_template",
          sessionId: testSessionId,
          templateId,
        }),
      })

      if (response.ok) {
        alert("Test message sent successfully!")
      } else {
        alert("Failed to send test message")
      }
    } catch (error) {
      console.error("Test failed:", error)
      alert("Failed to send test message")
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "welcome":
        return "bg-green-100 text-green-800"
      case "proactive":
        return "bg-blue-100 text-blue-800"
      case "follow_up":
        return "bg-yellow-100 text-yellow-800"
      case "closing":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminHeader title="Chat Automation" description="Manage automated messages and chat settings" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.filter((t) => t.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Welcome Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.filter((t) => t.type === "welcome").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proactive Messages</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.filter((t) => t.type === "proactive").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idle Timeout</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.idle_timeout_minutes}min</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="settings">Automation Settings</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Automated Message Templates</h3>
            <Button onClick={() => setShowTemplateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge className={getTypeColor(template.type)}>{template.type}</Badge>
                      <Badge variant="outline">{template.trigger_condition}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={(checked) => handleToggleTemplate(template.id, "is_active", checked)}
                      />
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Priority: {template.priority} • Delay: {template.delay_seconds}s
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Message Content</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">{template.message_content}</div>
                  </div>

                  {Object.keys(template.variables).length > 0 && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Variables</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.keys(template.variables).map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleTestTemplate(template.id)}>
                      <Send className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>Configure automated message behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="welcome-enabled">Welcome Messages</Label>
                  <Switch
                    id="welcome-enabled"
                    checked={settings.welcome_message_enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, welcome_message_enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="proactive-enabled">Proactive Messages</Label>
                  <Switch
                    id="proactive-enabled"
                    checked={settings.proactive_messages_enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, proactive_messages_enabled: checked })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-start">Business Hours Start</Label>
                  <Input
                    id="business-start"
                    type="time"
                    value={settings.business_hours_start}
                    onChange={(e) => setSettings({ ...settings, business_hours_start: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="business-end">Business Hours End</Label>
                  <Input
                    id="business-end"
                    type="time"
                    value={settings.business_hours_end}
                    onChange={(e) => setSettings({ ...settings, business_hours_end: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="idle-timeout">Idle Timeout (minutes)</Label>
                  <Input
                    id="idle-timeout"
                    type="number"
                    value={settings.idle_timeout_minutes}
                    onChange={(e) =>
                      setSettings({ ...settings, idle_timeout_minutes: Number.parseInt(e.target.value) || 5 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="no-response-timeout">No Response Timeout (minutes)</Label>
                  <Input
                    id="no-response-timeout"
                    type="number"
                    value={settings.no_response_timeout_minutes}
                    onChange={(e) =>
                      setSettings({ ...settings, no_response_timeout_minutes: Number.parseInt(e.target.value) || 10 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="max-proactive">Max Proactive Messages</Label>
                  <Input
                    id="max-proactive"
                    type="number"
                    value={settings.max_proactive_messages}
                    onChange={(e) =>
                      setSettings({ ...settings, max_proactive_messages: Number.parseInt(e.target.value) || 3 })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleSaveSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Automated Messages</CardTitle>
              <CardDescription>Test automated messages with a session ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-session">Test Session ID</Label>
                <Input
                  id="test-session"
                  value={testSessionId}
                  onChange={(e) => setTestSessionId(e.target.value)}
                  placeholder="Enter session ID for testing"
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Use the Test button on individual templates above to send test messages to this session.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Automated Message Template</DialogTitle>
            <DialogDescription>Create a new automated message template</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Welcome Message"
                />
              </div>
              <div>
                <Label htmlFor="template-type">Type</Label>
                <Select
                  value={newTemplate.type}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="proactive">Proactive</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="closing">Closing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trigger-condition">Trigger Condition</Label>
                <Select
                  value={newTemplate.trigger_condition}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, trigger_condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session_start">Session Start</SelectItem>
                    <SelectItem value="idle_5min">Idle 5 Minutes</SelectItem>
                    <SelectItem value="no_response_10min">No Response 10 Minutes</SelectItem>
                    <SelectItem value="outside_hours">Outside Business Hours</SelectItem>
                    <SelectItem value="queue_position">Queue Position</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="delay-seconds">Delay (seconds)</Label>
                <Input
                  id="delay-seconds"
                  type="number"
                  value={newTemplate.delay_seconds}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, delay_seconds: Number.parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message-content">Message Content</Label>
              <Textarea
                id="message-content"
                value={newTemplate.message_content}
                onChange={(e) => setNewTemplate({ ...newTemplate, message_content: e.target.value })}
                placeholder="Enter your automated message content..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="variables">Variables (JSON)</Label>
              <Textarea
                id="variables"
                value={newTemplate.variables}
                onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value })}
                placeholder='{"variable_name": "default_value"}'
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTemplate} disabled={!newTemplate.name || !newTemplate.message_content}>
              Add Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
