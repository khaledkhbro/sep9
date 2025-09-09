"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FileCheck,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
  Camera,
  FileText,
  CreditCard,
  User,
  Eye,
  Download,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import { validateVerificationFile, formatFileSize } from "@/lib/verification-upload"

interface VerificationSetting {
  id: number
  document_type: string
  display_name: string
  description: string
  enabled: boolean
  max_file_size_mb: number
  allowed_formats: string[]
}

interface VerificationRequest {
  id: number
  document_type: string
  file_url: string
  file_name: string
  file_size: number
  status: "pending" | "approved" | "rejected"
  rejection_reason?: string
  created_at: string
  updated_at: string
  mime_type?: string
}

interface VerificationStatus {
  is_verified: boolean
  verified_document_type?: string
  verified_at?: string
  verification_level: string
}

export default function VerificationPage() {
  const [settings, setSettings] = useState<VerificationSetting[]>([])
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("")
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch verification settings
      const settingsResponse = await fetch("/api/user/verification/settings")
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setSettings(settingsData.settings || [])
      }

      // Fetch user's verification requests
      const requestsResponse = await fetch("/api/user/verification/requests")
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        setRequests(requestsData.requests || [])
      }

      // Fetch user's verification status
      const statusResponse = await fetch("/api/user/verification/status")
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setVerificationStatus(statusData.status)
      }
    } catch (error) {
      console.error("Error fetching verification data:", error)
      toast({
        title: "Error",
        description: "Failed to load verification information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    const setting = settings.find((s) => s.document_type === documentType)
    if (!setting) return

    const validation = validateVerificationFile(file)
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    // Additional validation against settings
    if (file.size > setting.max_file_size_mb * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size must be less than ${setting.max_file_size_mb}MB`,
        variant: "destructive",
      })
      return
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    if (!fileExtension || !setting.allowed_formats.includes(fileExtension)) {
      toast({
        title: "Invalid file format",
        description: `Allowed formats: ${setting.allowed_formats.join(", ").toUpperCase()}`,
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    setSelectedDocumentType(documentType)
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocumentType) return

    setUploading(selectedDocumentType)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("document_type", selectedDocumentType)

      const response = await fetch("/api/user/verification/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        await fetchData()
        setSelectedFile(null)
        setSelectedDocumentType("")
        toast({
          title: "Success",
          description: "Document uploaded successfully for review",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || "Upload failed")
      }
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      })
    } finally {
      setUploading(null)
    }
  }

  const getDocumentIcon = (documentType: string) => {
    switch (documentType) {
      case "student_id":
        return <User className="w-6 h-6" />
      case "national_id":
        return <CreditCard className="w-6 h-6" />
      case "driving_license":
        return <Camera className="w-6 h-6" />
      case "passport":
        return <FileText className="w-6 h-6" />
      default:
        return <FileCheck className="w-6 h-6" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Under Review
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatFileSizeDisplay = (bytes: number) => {
    return formatFileSize(bytes)
  }

  const getExistingRequest = (documentType: string) => {
    return requests.find((r) => r.document_type === documentType)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
          <p className="text-gray-600 mt-2">Verify your identity to unlock premium features and build trust</p>
        </div>
        {verificationStatus?.is_verified && (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Shield className="w-4 h-4 mr-2" />
            Verified Account
          </Badge>
        )}
      </div>

      {/* Verification Status */}
      {verificationStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verificationStatus.is_verified ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800">Account Verified</h3>
                  <p className="text-sm text-green-600">
                    Verified with {verificationStatus.verified_document_type?.replace("_", " ")} on{" "}
                    {verificationStatus.verified_at && format(new Date(verificationStatus.verified_at), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium text-yellow-800">Verification Required</h3>
                  <p className="text-sm text-yellow-600">
                    Complete identity verification to access all platform features
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Why Verify Your Identity?</CardTitle>
          <CardDescription>Unlock these benefits when you complete verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Increased Trust</p>
                <p className="text-sm text-gray-600">Build credibility with clients</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Premium Features</p>
                <p className="text-sm text-gray-600">Access advanced tools</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Higher Limits</p>
                <p className="text-sm text-gray-600">Increased transaction limits</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Verification Documents</CardTitle>
          <CardDescription>Choose one of the accepted document types to verify your identity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings
              .filter((setting) => setting.enabled)
              .map((setting) => {
                const existingRequest = getExistingRequest(setting.document_type)
                const canUpload = !existingRequest || existingRequest.status === "rejected"

                return (
                  <div key={setting.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {getDocumentIcon(setting.document_type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{setting.display_name}</h3>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      </div>
                      {existingRequest && getStatusBadge(existingRequest.status)}
                    </div>

                    {existingRequest && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Submitted:</span>
                          <span>{format(new Date(existingRequest.created_at), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">File:</span>
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[150px]">{existingRequest.file_name}</span>
                            <span className="text-xs text-gray-500">
                              ({formatFileSizeDisplay(existingRequest.file_size)})
                            </span>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Submitted Document</DialogTitle>
                                  <DialogDescription>
                                    {existingRequest.file_name} • {formatFileSizeDisplay(existingRequest.file_size)}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                    {existingRequest.mime_type?.includes("pdf") ? (
                                      <div className="text-center">
                                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600">PDF Document</p>
                                      </div>
                                    ) : (
                                      <img
                                        src={existingRequest.file_url || "/placeholder.svg"}
                                        alt="Verification document"
                                        className="max-w-full max-h-full object-contain rounded"
                                      />
                                    )}
                                  </div>
                                  <Button variant="outline" asChild className="w-full bg-transparent">
                                    <a href={existingRequest.file_url} target="_blank" rel="noopener noreferrer">
                                      <Download className="w-4 h-4 mr-2" />
                                      Download Original
                                    </a>
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        {existingRequest.status === "rejected" && existingRequest.rejection_reason && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{existingRequest.rejection_reason}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    {canUpload && (
                      <div className="space-y-3">
                        <div className="text-xs text-gray-500">
                          Max size: {setting.max_file_size_mb}MB • Formats:{" "}
                          {setting.allowed_formats.join(", ").toUpperCase()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept={setting.allowed_formats.map((f) => `.${f}`).join(",")}
                            onChange={(e) => handleFileSelect(e, setting.document_type)}
                            className="flex-1"
                          />
                          {selectedFile && selectedDocumentType === setting.document_type && (
                            <Button
                              onClick={handleUpload}
                              disabled={uploading === setting.document_type}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {uploading === setting.document_type ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Upload
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {!canUpload && existingRequest?.status === "approved" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-green-700 text-sm font-medium">Document approved and verified</p>
                      </div>
                    )}

                    {!canUpload && existingRequest?.status === "pending" && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-700 text-sm font-medium">
                          Document is under review. You'll be notified once it's processed.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>

          {settings.filter((s) => s.enabled).length === 0 && (
            <div className="text-center py-8">
              <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No verification options are currently available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
