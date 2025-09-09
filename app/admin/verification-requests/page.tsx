"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileCheck,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Mail,
  Phone,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface VerificationRequest {
  id: number
  user_id: string
  document_type: string
  file_url: string
  file_name: string
  file_size: number
  status: "pending" | "approved" | "rejected"
  rejection_reason?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
  }
  reviewer?: {
    firstName: string
    lastName: string
    email: string
  }
}

export default function VerificationRequestsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [filters, setFilters] = useState({
    status: "all",
    document_type: "all",
    search: "",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  const { toast } = useToast()

  useEffect(() => {
    fetchRequests()
  }, [currentPage, filters])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        status: filters.status,
        document_type: filters.document_type,
        search: filters.search,
      })

      const response = await fetch(`/api/admin/verification/requests?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
      }
    } catch (error) {
      console.error("Error fetching verification requests:", error)
      toast({
        title: "Error",
        description: "Failed to load verification requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: number) => {
    setProcessing(requestId.toString())
    try {
      const response = await fetch(`/api/admin/verification/requests/${requestId}/approve`, {
        method: "POST",
      })

      if (response.ok) {
        await fetchRequests()
        toast({
          title: "Success",
          description: "Verification request approved successfully",
        })
        setSelectedRequest(null)
      } else {
        throw new Error("Failed to approve request")
      }
    } catch (error) {
      console.error("Error approving request:", error)
      toast({
        title: "Error",
        description: "Failed to approve verification request",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (requestId: number) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      })
      return
    }

    setProcessing(requestId.toString())
    try {
      const response = await fetch(`/api/admin/verification/requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      })

      if (response.ok) {
        await fetchRequests()
        toast({
          title: "Success",
          description: "Verification request rejected",
        })
        setSelectedRequest(null)
        setRejectionReason("")
      } else {
        throw new Error("Failed to reject request")
      }
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast({
        title: "Error",
        description: "Failed to reject verification request",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const filteredRequests = requests.filter((request) => {
    if (filters.status !== "all" && request.status !== filters.status) return false
    if (filters.document_type !== "all" && request.document_type !== filters.document_type) return false
    if (
      filters.search &&
      !request.user?.email?.toLowerCase().includes(filters.search.toLowerCase()) &&
      !request.user?.firstName?.toLowerCase().includes(filters.search.toLowerCase()) &&
      !request.user?.lastName?.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verification Requests</h1>
          <p className="text-gray-600 mt-2">Review and manage user document verification requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {requests.filter((r) => r.status === "pending").length} Pending
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="document_type">Document Type</Label>
              <Select
                value={filters.document_type}
                onValueChange={(value) => setFilters({ ...filters, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="student_id">Student ID</SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="driving_license">Driving License</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setFilters({ status: "all", document_type: "all", search: "" })
                  setCurrentPage(1)
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Requests ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {request.user?.firstName} {request.user?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {request.user?.email}
                      </p>
                      {request.user?.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {request.user?.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(request.status)}
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(request.created_at), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Document Type</p>
                    <p className="capitalize">{request.document_type.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">File Name</p>
                    <p className="truncate">{request.file_name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">File Size</p>
                    <p>{formatFileSize(request.file_size)}</p>
                  </div>
                </div>

                {request.status === "rejected" && request.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-700 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Rejection Reason</span>
                    </div>
                    <p className="text-red-600 text-sm">{request.rejection_reason}</p>
                  </div>
                )}

                {request.status === "approved" && request.reviewer && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-700 mb-1">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Approved by</span>
                    </div>
                    <p className="text-green-600 text-sm">
                      {request.reviewer.firstName} {request.reviewer.lastName} on{" "}
                      {format(new Date(request.reviewed_at!), "MMM dd, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Verification Request Details</DialogTitle>
                        <DialogDescription>Review the submitted document and user information</DialogDescription>
                      </DialogHeader>
                      {selectedRequest && (
                        <Tabs defaultValue="document" className="space-y-4">
                          <TabsList>
                            <TabsTrigger value="document">Document</TabsTrigger>
                            <TabsTrigger value="user">User Info</TabsTrigger>
                            <TabsTrigger value="actions">Actions</TabsTrigger>
                          </TabsList>

                          <TabsContent value="document" className="space-y-4">
                            <div className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium">Submitted Document</h4>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={selectedRequest.file_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </a>
                                </Button>
                              </div>
                              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                {selectedRequest.file_name.toLowerCase().includes(".pdf") ? (
                                  <div className="text-center">
                                    <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-600">PDF Document</p>
                                    <p className="text-sm text-gray-500">{selectedRequest.file_name}</p>
                                  </div>
                                ) : (
                                  <img
                                    src={selectedRequest.file_url || "/placeholder.svg"}
                                    alt="Verification document"
                                    className="max-w-full max-h-full object-contain rounded"
                                  />
                                )}
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="user" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Full Name</Label>
                                <p className="font-medium">
                                  {selectedRequest.user?.firstName} {selectedRequest.user?.lastName}
                                </p>
                              </div>
                              <div>
                                <Label>Email</Label>
                                <p className="font-medium">{selectedRequest.user?.email}</p>
                              </div>
                              <div>
                                <Label>Document Type</Label>
                                <p className="font-medium capitalize">
                                  {selectedRequest.document_type.replace("_", " ")}
                                </p>
                              </div>
                              <div>
                                <Label>Submitted</Label>
                                <p className="font-medium">
                                  {format(new Date(selectedRequest.created_at), "MMM dd, yyyy 'at' HH:mm")}
                                </p>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="actions" className="space-y-4">
                            {selectedRequest.status === "pending" && (
                              <div className="space-y-4">
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleApprove(selectedRequest.id)}
                                    disabled={processing === selectedRequest.id.toString()}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="rejection_reason">Rejection Reason</Label>
                                  <Textarea
                                    id="rejection_reason"
                                    placeholder="Provide a clear reason for rejection..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                  />
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleReject(selectedRequest.id)}
                                    disabled={processing === selectedRequest.id.toString() || !rejectionReason.trim()}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            )}
                            {selectedRequest.status !== "pending" && (
                              <div className="text-center py-8">
                                <p className="text-gray-600">This request has already been {selectedRequest.status}.</p>
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      )}
                    </DialogContent>
                  </Dialog>

                  {request.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={processing === request.id.toString()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request)
                          setRejectionReason("")
                        }}
                        disabled={processing === request.id.toString()}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {filteredRequests.length === 0 && (
              <div className="text-center py-8">
                <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No verification requests found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
