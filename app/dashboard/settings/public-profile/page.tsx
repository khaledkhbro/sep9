"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Save, RefreshCw, Eye, Globe, DollarSign, ExternalLink, User, Settings } from "lucide-react"
import Link from "next/link"

interface PublicProfileSettings {
  // Profile visibility
  isPublic: boolean
  showFullName: boolean
  showLocation: boolean
  showBio: boolean
  showSkills: boolean
  showRating: boolean
  showReviews: boolean
  showTotalOrders: boolean
  showMemberSince: boolean

  // Earnings display
  showEarnings: boolean
  showTotalEarnings: boolean
  showYearlyEarnings: boolean
  showMonthlyEarnings: boolean
  showLastMonthEarnings: boolean

  // Additional settings
  showResponseTime: boolean
  showLastActive: boolean
  showHourlyRate: boolean
  customHourlyRate?: number

  // Profile customization
  profileTitle: string
  profileTagline: string
  customBio: string

  // SEO settings
  metaTitle: string
  metaDescription: string
  customSlug: string
}

export default function PublicProfileSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState("")

  const [settings, setSettings] = useState<PublicProfileSettings>({
    // Profile visibility - defaults to showing most info
    isPublic: true,
    showFullName: true,
    showLocation: true,
    showBio: true,
    showSkills: true,
    showRating: true,
    showReviews: true,
    showTotalOrders: true,
    showMemberSince: true,

    // Earnings display - defaults to private
    showEarnings: false,
    showTotalEarnings: false,
    showYearlyEarnings: false,
    showMonthlyEarnings: false,
    showLastMonthEarnings: false,

    // Additional settings
    showResponseTime: true,
    showLastActive: true,
    showHourlyRate: false,
    customHourlyRate: undefined,

    // Profile customization
    profileTitle: "",
    profileTagline: "",
    customBio: "",

    // SEO settings
    metaTitle: "",
    metaDescription: "",
    customSlug: "",
  })

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    // Update preview URL when custom slug changes
    if (settings.customSlug) {
      setPreviewUrl(`/seller/${settings.customSlug}`)
    } else {
      setPreviewUrl("/seller/your-username") // fallback
    }
  }, [settings.customSlug])

  const loadSettings = async () => {
    try {
      console.log("[v0] Loading public profile settings...")
      const response = await fetch("/api/dashboard/public-profile-settings")
      if (!response.ok) {
        throw new Error("Failed to load settings")
      }

      const data = await response.json()
      console.log("[v0] Loaded public profile settings:", data)

      setSettings(data.settings || settings)
    } catch (error) {
      console.error("[v0] Error loading public profile settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings. Using defaults.",
        variant: "destructive",
      })
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      console.log("[v0] Saving public profile settings...")

      const response = await fetch("/api/dashboard/public-profile-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      const result = await response.json()
      console.log("[v0] Public profile settings saved successfully:", result)

      toast({
        title: "Settings Updated",
        description: "Your public profile settings have been saved successfully.",
      })
    } catch (error) {
      console.error("[v0] Error saving public profile settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = <K extends keyof PublicProfileSettings>(key: K, value: PublicProfileSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (initialLoading) {
    return (
      <>
        <DashboardHeader
          title="Public Profile Settings"
          description="Configure your public seller profile visibility and information."
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading settings...</span>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader
        title="Public Profile Settings"
        description="Configure your public seller profile visibility and information."
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Status & Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Profile Status
              </CardTitle>
              <CardDescription>
                Control whether your profile is publicly visible and accessible via direct link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">Make your profile visible to anyone with the link</p>
                </div>
                <Switch checked={settings.isPublic} onCheckedChange={(checked) => updateSetting("isPublic", checked)} />
              </div>

              {settings.isPublic && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    <span className="font-medium">Your Public Profile URL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input value={`${window.location.origin}${previewUrl}`} readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="sm" asChild>
                      <Link href={previewUrl} target="_blank">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>Customize how your profile appears to potential clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profileTitle">Professional Title</Label>
                  <Input
                    id="profileTitle"
                    placeholder="e.g., Professional UI/UX Designer"
                    value={settings.profileTitle}
                    onChange={(e) => updateSetting("profileTitle", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customSlug">Custom URL Slug</Label>
                  <Input
                    id="customSlug"
                    placeholder="your-name"
                    value={settings.customSlug}
                    onChange={(e) => updateSetting("customSlug", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileTagline">Profile Tagline</Label>
                <Input
                  id="profileTagline"
                  placeholder="A brief, compelling description of what you do"
                  value={settings.profileTagline}
                  onChange={(e) => updateSetting("profileTagline", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customBio">Extended Bio</Label>
                <Textarea
                  id="customBio"
                  placeholder="Write a detailed description of your experience, skills, and what makes you unique..."
                  rows={4}
                  value={settings.customBio}
                  onChange={(e) => updateSetting("customBio", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Visibility Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Visibility Settings
              </CardTitle>
              <CardDescription>Choose what information to display on your public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Basic Information</h4>
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    {[
                      { key: "showFullName", label: "Full Name", desc: "Display your full name" },
                      { key: "showLocation", label: "Location", desc: "Show your city/country" },
                      { key: "showBio", label: "Bio", desc: "Display your bio/description" },
                      { key: "showSkills", label: "Skills", desc: "Show your skill tags" },
                      { key: "showMemberSince", label: "Member Since", desc: "Show join date" },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm">{label}</Label>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={settings[key as keyof PublicProfileSettings] as boolean}
                          onCheckedChange={(checked) => updateSetting(key as keyof PublicProfileSettings, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Performance Metrics</h4>
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    {[
                      { key: "showRating", label: "Rating & Reviews", desc: "Display star rating and review count" },
                      { key: "showTotalOrders", label: "Total Orders", desc: "Show completed order count" },
                      { key: "showResponseTime", label: "Response Time", desc: "Display average response time" },
                      { key: "showLastActive", label: "Last Active", desc: "Show when you were last online" },
                      { key: "showHourlyRate", label: "Hourly Rate", desc: "Display your hourly rate" },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm">{label}</Label>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={settings[key as keyof PublicProfileSettings] as boolean}
                          onCheckedChange={(checked) => updateSetting(key as keyof PublicProfileSettings, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {settings.showHourlyRate && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <Label htmlFor="customHourlyRate">Custom Hourly Rate (USD)</Label>
                  <Input
                    id="customHourlyRate"
                    type="number"
                    placeholder="50"
                    className="mt-2 w-32"
                    value={settings.customHourlyRate || ""}
                    onChange={(e) => updateSetting("customHourlyRate", Number.parseFloat(e.target.value) || undefined)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Earnings Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Earnings Display
              </CardTitle>
              <CardDescription>Control what earnings information is visible to potential clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Show Earnings Section</Label>
                  <p className="text-sm text-muted-foreground">Enable earnings display on your public profile</p>
                </div>
                <Switch
                  checked={settings.showEarnings}
                  onCheckedChange={(checked) => updateSetting("showEarnings", checked)}
                />
              </div>

              {settings.showEarnings && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <h4 className="font-medium">Earnings Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "showTotalEarnings", label: "Total Earnings", desc: "All-time earnings" },
                      { key: "showYearlyEarnings", label: "This Year", desc: "Current year earnings" },
                      { key: "showMonthlyEarnings", label: "This Month", desc: "Current month earnings" },
                      { key: "showLastMonthEarnings", label: "Last Month", desc: "Previous month earnings" },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm">{label}</Label>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={settings[key as keyof PublicProfileSettings] as boolean}
                          onCheckedChange={(checked) => updateSetting(key as keyof PublicProfileSettings, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!settings.showEarnings && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Displaying earnings can help build trust with potential clients by showcasing
                    your success and experience level.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                SEO Settings
              </CardTitle>
              <CardDescription>Optimize your profile for search engines and social sharing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  placeholder="Your Name - Professional Service Provider"
                  value={settings.metaTitle}
                  onChange={(e) => updateSetting("metaTitle", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Recommended: 50-60 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="Brief description of your services and expertise for search engines..."
                  rows={3}
                  value={settings.metaDescription}
                  onChange={(e) => updateSetting("metaDescription", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Recommended: 150-160 characters</p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={loading}>
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
