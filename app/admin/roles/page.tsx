"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { UserCheck, Plus, Shield, Settings, Clock, Globe, ChevronLeft, ChevronRight } from "lucide-react"

interface AdminRole {
  id: string
  name: string
  displayName: string
  description: string
  color: string
  isSystemRole: boolean
  userCount: number
  permissions: string[]
}

interface AdminPermission {
  id: string
  name: string
  displayName: string
  description: string
  category: string
}

interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  roleName: string
  roleDisplayName: string
  status: string
  lastLogin: string
}

interface AdminPagePermission {
  page: string
  name: string
  description: string
  category: string
}

const ADMIN_PAGES: AdminPagePermission[] = [
  { page: "/admin", name: "Dashboard", description: "View admin dashboard and overview", category: "Core" },
  { page: "/admin/users", name: "User Management", description: "Manage platform users", category: "User Management" },
  {
    page: "/admin/jobs",
    name: "Job Management",
    description: "Manage jobs and listings",
    category: "Content Management",
  },
  {
    page: "/admin/services",
    name: "Service Management",
    description: "Manage services and offerings",
    category: "Content Management",
  },
  {
    page: "/admin/orders",
    name: "Order Management",
    description: "View and manage orders",
    category: "Transaction Management",
  },
  {
    page: "/admin/categories",
    name: "Category Management",
    description: "Manage job categories",
    category: "Content Management",
  },
  {
    page: "/admin/marketplace-categories",
    name: "Marketplace Categories",
    description: "Manage marketplace categories",
    category: "Content Management",
  },
  {
    page: "/admin/transactions",
    name: "Transaction Management",
    description: "View and manage transactions",
    category: "Transaction Management",
  },
  { page: "/admin/disputes", name: "Dispute Management", description: "Handle user disputes", category: "Support" },
  {
    page: "/admin/support-management",
    name: "Support Management",
    description: "Manage support tickets",
    category: "Support",
  },
  {
    page: "/admin/chat-management",
    name: "Chat Management",
    description: "Monitor and manage chats",
    category: "Support",
  },
  {
    page: "/admin/wallet-management",
    name: "Wallet Management",
    description: "Manage user wallets",
    category: "Financial",
  },
  {
    page: "/admin/payment-methods",
    name: "Payment Methods",
    description: "Configure payment methods",
    category: "Financial",
  },
  {
    page: "/admin/referral-management",
    name: "Referral Management",
    description: "Manage referral system",
    category: "Marketing",
  },
  {
    page: "/admin/roles",
    name: "Role Management",
    description: "Manage admin roles and permissions",
    category: "System",
  },
  { page: "/admin/settings", name: "System Settings", description: "Configure system settings", category: "System" },
]

export default function AdminRolesPage() {
  const [activeTab, setActiveTab] = useState("roles")
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [permissions, setPermissions] = useState<AdminPermission[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [activities, setActivities] = useState([])
  const [pagePermissions, setPagePermissions] = useState<Record<string, string[]>>({})

  const [rolesPagination, setRolesPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  })

  const [usersPagination, setUsersPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  })

  const [activitiesPagination, setActivitiesPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  })

  const [permissionsPagination, setPermissionsPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  })

  // Dialog states
  const [createRoleDialogOpen, setCreateRoleDialogOpen] = useState(false)
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false)
  const [createAdminDialogOpen, setCreateAdminDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null)

  const { toast } = useToast()

  // Form states for role creation/editing
  const [roleName, setRoleName] = useState("")
  const [roleDisplayName, setRoleDisplayName] = useState("")
  const [roleDescription, setRoleDescription] = useState("")
  const [roleColor, setRoleColor] = useState("bg-gray-100 text-gray-800")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  // Form states for admin creation
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [newAdminFirstName, setNewAdminFirstName] = useState("")
  const [newAdminLastName, setNewAdminLastName] = useState("")
  const [newAdminRoleId, setNewAdminRoleId] = useState("")
  const [newAdminPassword, setNewAdminPassword] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      await Promise.all([fetchRoles(), fetchPermissions(), fetchAdminUsers(), fetchAdminActivities()])
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async (page = 1) => {
    try {
      const response = await fetch(`/api/admin/roles?page=${page}&limit=${rolesPagination.itemsPerPage}`)
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || data)
        setRolesPagination((prev) => ({
          ...prev,
          currentPage: page,
          totalItems: data.total || data.length,
        }))
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    }
  }

  const fetchAdminUsers = async (page = 1) => {
    try {
      const response = await fetch(`/api/admin/roles/users?page=${page}&limit=${usersPagination.itemsPerPage}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || data)
        setUsersPagination((prev) => ({
          ...prev,
          currentPage: page,
          totalItems: data.total || data.length,
        }))
      }
    } catch (error) {
      console.error("Failed to fetch admin users:", error)
    }
  }

  const fetchAdminActivities = async (page = 1) => {
    try {
      const response = await fetch(
        `/api/admin/roles/activities?page=${page}&limit=${activitiesPagination.itemsPerPage}`,
      )
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || data)
        setActivitiesPagination((prev) => ({
          ...prev,
          currentPage: page,
          totalItems: data.total || data.length,
        }))
      }
    } catch (error) {
      console.error("Failed to fetch admin activities:", error)
    }
  }

  const fetchPermissions = async (page = 1) => {
    try {
      const response = await fetch(`/api/admin/permissions?page=${page}&limit=${permissionsPagination.itemsPerPage}`)
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions || data)
        setPermissionsPagination((prev) => ({
          ...prev,
          currentPage: page,
          totalItems: data.total || data.length,
        }))
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error)
    }
  }

  const PaginationControls = ({
    pagination,
    onPageChange,
    section,
  }: {
    pagination: { currentPage: number; itemsPerPage: number; totalItems: number }
    onPageChange: (page: number) => void
    section: string
  }) => {
    const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage)

    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{" "}
          {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems}{" "}
          {section}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1
              } else if (pagination.currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = pagination.currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={pagination.currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const handleCreateRoleApi = async () => {
    try {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roleName,
          displayName: roleDisplayName,
          description: roleDescription,
          color: roleColor,
          permissions: selectedPermissions,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role created successfully",
        })
        setCreateRoleDialogOpen(false)
        resetRoleForm()
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to create role",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRoleApi = async () => {
    if (!selectedRole) return

    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: roleDisplayName,
          description: roleDescription,
          color: roleColor,
          permissions: selectedPermissions,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role updated successfully",
        })
        setEditRoleDialogOpen(false)
        resetRoleForm()
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to update role",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRoleApi = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role deleted successfully",
        })
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to delete role",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      })
    }
  }

  const handleCreateAdminApi = async () => {
    try {
      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAdminEmail,
          firstName: newAdminFirstName,
          lastName: newAdminLastName,
          roleId: newAdminRoleId,
          password: newAdminPassword,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Admin user created successfully",
        })
        setCreateAdminDialogOpen(false)
        resetAdminForm()
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to create admin user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create admin user",
        variant: "destructive",
      })
    }
  }

  const resetRoleForm = () => {
    setRoleName("")
    setRoleDisplayName("")
    setRoleDescription("")
    setRoleColor("bg-gray-100 text-gray-800")
    setSelectedPermissions([])
    setSelectedRole(null)
  }

  const resetAdminForm = () => {
    setNewAdminEmail("")
    setNewAdminFirstName("")
    setNewAdminLastName("")
    setNewAdminRoleId("")
    setNewAdminPassword("")
  }

  const openEditRoleDialog = (role: AdminRole) => {
    setSelectedRole(role)
    setRoleDisplayName(role.displayName)
    setRoleDescription(role.description)
    setRoleColor(role.color)
    setSelectedPermissions(role.permissions)
    setEditRoleDialogOpen(true)
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId],
    )
  }

  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    },
    {} as Record<string, AdminPermission[]>,
  )

  const colorOptions = [
    { value: "bg-red-100 text-red-800", label: "Red", preview: "bg-red-100" },
    { value: "bg-blue-100 text-blue-800", label: "Blue", preview: "bg-blue-100" },
    { value: "bg-green-100 text-green-800", label: "Green", preview: "bg-green-100" },
    { value: "bg-yellow-100 text-yellow-800", label: "Yellow", preview: "bg-yellow-100" },
    { value: "bg-purple-100 text-purple-800", label: "Purple", preview: "bg-purple-100" },
    { value: "bg-pink-100 text-pink-800", label: "Pink", preview: "bg-pink-100" },
    { value: "bg-indigo-100 text-indigo-800", label: "Indigo", preview: "bg-indigo-100" },
    { value: "bg-gray-100 text-gray-800", label: "Gray", preview: "bg-gray-100" },
  ]

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const permissionCategories = Array.from(new Set(permissions.map((p) => p.category)))

  const handleCreateRole = async () => {
    if (!roleName || !roleDisplayName || !roleDescription) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const newRole: AdminRole = {
      id: (roles.length + 1).toString(),
      name: roleName.toLowerCase().replace(/\s+/g, "_"),
      displayName: roleDisplayName,
      description: roleDescription,
      color: roleColor,
      isSystemRole: false,
      userCount: 0,
      permissions: selectedPermissions,
    }

    setRoles([...roles, newRole])
    setCreateRoleDialogOpen(false)

    // Reset form
    setRoleName("")
    setRoleDisplayName("")
    setRoleDescription("")
    setRoleColor("bg-gray-100 text-gray-800")
    setSelectedPermissions([])

    toast({
      title: "Success",
      description: "Role created successfully",
    })
  }

  const handleUpdateRole = async () => {
    if (!selectedRole) return

    const updatedRoles = roles.map((role) =>
      role.id === selectedRole.id
        ? {
            ...role,
            displayName: roleDisplayName,
            description: roleDescription,
            color: roleColor,
            permissions: selectedPermissions,
          }
        : role,
    )

    setRoles(updatedRoles)
    setEditRoleDialogOpen(false)
    setSelectedRole(null)

    // Reset form
    setRoleDisplayName("")
    setRoleDescription("")
    setRoleColor("bg-gray-100 text-gray-800")
    setSelectedPermissions([])

    toast({
      title: "Success",
      description: "Role updated successfully",
    })
  }

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find((r) => r.id === roleId)
    if (role?.isSystemRole) {
      toast({
        title: "Error",
        description: "Cannot delete system roles",
        variant: "destructive",
      })
      return
    }

    if (role?.userCount > 0) {
      toast({
        title: "Error",
        description: "Cannot delete role with assigned users",
        variant: "destructive",
      })
      return
    }

    setRoles(roles.filter((r) => r.id !== roleId))
    toast({
      title: "Success",
      description: "Role deleted successfully",
    })
  }

  const handleCreateAdmin = async () => {
    if (!newAdminFirstName || !newAdminLastName || !newAdminEmail || !newAdminPassword || !newAdminRoleId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const selectedRole = roles.find((r) => r.id === newAdminRoleId)
    if (!selectedRole) return

    const newAdmin: AdminUser = {
      id: (users.length + 1).toString(),
      email: newAdminEmail,
      firstName: newAdminFirstName,
      lastName: newAdminLastName,
      roleName: selectedRole.name,
      roleDisplayName: selectedRole.displayName,
      status: "Active",
      lastLogin: "Never",
    }

    setUsers([...users, newAdmin])
    setCreateAdminDialogOpen(false)

    // Reset form
    setNewAdminFirstName("")
    setNewAdminLastName("")
    setNewAdminEmail("")
    setNewAdminPassword("")
    setNewAdminRoleId("")

    toast({
      title: "Success",
      description: "Admin user created successfully",
    })
  }

  const openEditRole = (role: AdminRole) => {
    setSelectedRole(role)
    setRoleDisplayName(role.displayName)
    setRoleDescription(role.description)
    setRoleColor(role.color)
    setSelectedPermissions(role.permissions)
    setEditRoleDialogOpen(true)
  }

  const handlePagePermissionToggle = (roleId: string, page: string, granted: boolean) => {
    setPagePermissions((prev) => ({
      ...prev,
      [roleId]: granted ? [...(prev[roleId] || []), page] : (prev[roleId] || []).filter((p) => p !== page),
    }))

    toast({
      title: "Success",
      description: `Page access ${granted ? "granted" : "revoked"} successfully`,
    })
  }

  const pagesByCategory = ADMIN_PAGES.reduce(
    (acc, page) => {
      if (!acc[page.category]) {
        acc[page.category] = []
      }
      acc[page.category].push(page)
      return acc
    },
    {} as Record<string, AdminPagePermission[]>,
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Custom Role Management</h1>
          <p className="text-gray-600 mt-2">Create custom roles with granular permissions and manage admin access</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createRoleDialogOpen} onOpenChange={setCreateRoleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={createAdminDialogOpen} onOpenChange={setCreateAdminDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Admin
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Custom Roles
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Admin Users
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Permission Matrix
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
          <TabsTrigger value="page-access" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Page Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Custom Roles</CardTitle>
              <CardDescription>Create and manage custom admin roles with specific permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <Card
                    key={role.id}
                    className="border-l-4"
                    style={{ borderLeftColor: role.color.replace("bg-", "#") }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{role.displayName}</CardTitle>
                        <Badge className={role.color}>{role.name}</Badge>
                      </div>
                      <CardDescription className="text-sm">{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <strong>{role.userCount}</strong> users assigned
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>{role.permissions.length}</strong> permissions
                        </div>
                        {role.isSystemRole && (
                          <Badge variant="secondary" className="text-xs">
                            System Role
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <PaginationControls pagination={rolesPagination} onPageChange={fetchRoles} section="roles" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>Manage admin users and their roles. Only Super Admins can modify roles.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.roleColor}>{user.roleDisplayName}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{user.lastLogin}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // setSelectedUser(user)
                            // setEditDialogOpen(true)
                          }}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Edit Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationControls pagination={usersPagination} onPageChange={fetchAdminUsers} section="users" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>View and compare permissions across all roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-64">Permission</TableHead>
                      {roles.map((role) => (
                        <TableHead key={role.id} className="text-center min-w-32">
                          <Badge className={role.color} variant="outline">
                            {role.displayName}
                          </Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissionCategories.map((category) => (
                      <React.Fragment key={category}>
                        <TableRow>
                          <TableCell
                            colSpan={roles.length + 1}
                            className="bg-gray-50 font-semibold text-gray-900 capitalize"
                          >
                            {category}
                          </TableCell>
                        </TableRow>
                        {permissions
                          .filter((p) => p.category === category)
                          .map((permission) => (
                            <TableRow key={permission.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{permission.displayName}</div>
                                  <div className="text-sm text-gray-500">{permission.description}</div>
                                </div>
                              </TableCell>
                              {roles.map((role) => (
                                <TableCell key={role.id} className="text-center">
                                  {role.permissions.includes(permission.id) ? (
                                    <div className="w-4 h-4 bg-green-500 rounded-full mx-auto"></div>
                                  ) : (
                                    <div className="w-4 h-4 bg-gray-200 rounded-full mx-auto"></div>
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                pagination={permissionsPagination}
                onPageChange={fetchPermissions}
                section="permissions"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Admin Activity Log</CardTitle>
              <CardDescription>Track all admin actions and system changes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="text-sm text-gray-500">{activity.timestamp}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{activity.adminEmail}</div>
                          <Badge className={`${activity.roleColor} text-xs`}>{activity.roleName}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {activity.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{activity.targetType}</TableCell>
                      <TableCell className="text-sm text-gray-600">{activity.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationControls
                pagination={activitiesPagination}
                onPageChange={fetchAdminActivities}
                section="activities"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <Dialog open={createRoleDialogOpen} onOpenChange={setCreateRoleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>Define a new admin role with specific permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roleName">Role Name (Internal)</Label>
                <Input
                  id="roleName"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="staff"
                />
              </div>
              <div>
                <Label htmlFor="roleDisplayName">Display Name</Label>
                <Input
                  id="roleDisplayName"
                  value={roleDisplayName}
                  onChange={(e) => setRoleDisplayName(e.target.value)}
                  placeholder="Staff Member"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Describe what this role can do..."
              />
            </div>
            <div>
              <Label>Role Color</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setRoleColor(color.value)}
                    className={`p-2 rounded border-2 ${
                      roleColor === color.value ? "border-blue-500" : "border-gray-200"
                    }`}
                  >
                    <div className={`w-full h-6 rounded ${color.preview}`}></div>
                    <div className="text-xs mt-1">{color.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="mt-2 space-y-4 max-h-64 overflow-y-auto border rounded p-4">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <div key={category}>
                    <h4 className="font-semibold text-gray-900 capitalize mb-2">{category} Management</h4>
                    <div className="grid grid-cols-2 gap-2 ml-4">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <Label htmlFor={permission.id} className="text-sm">
                            {permission.displayName}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} className="bg-red-600 hover:bg-red-700">
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRole?.displayName}</DialogTitle>
            <DialogDescription>Modify role permissions and settings</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role Name (Internal)</Label>
                  <Input value={roleName} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label htmlFor="editRoleDisplayName">Display Name</Label>
                  <Input
                    id="editRoleDisplayName"
                    value={roleDisplayName}
                    onChange={(e) => setRoleDisplayName(e.target.value)}
                    disabled={selectedRole.isSystemRole}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editRoleDescription">Description</Label>
                <Textarea
                  id="editRoleDescription"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  disabled={selectedRole.isSystemRole}
                />
              </div>
              {!selectedRole.isSystemRole && (
                <div>
                  <Label>Role Color</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setRoleColor(color.value)}
                        className={`p-2 rounded border-2 ${
                          roleColor === color.value ? "border-blue-500" : "border-gray-200"
                        }`}
                      >
                        <div className={`w-full h-6 rounded ${color.preview}`}></div>
                        <div className="text-xs mt-1">{color.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label>Permissions</Label>
                <div className="mt-2 space-y-4 max-h-64 overflow-y-auto border rounded p-4">
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                    <div key={category}>
                      <h4 className="font-semibold text-gray-900 capitalize mb-2">{category} Management</h4>
                      <div className="grid grid-cols-2 gap-2 ml-4">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${permission.id}`}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <Label htmlFor={`edit-${permission.id}`} className="text-sm">
                              {permission.displayName}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} className="bg-red-600 hover:bg-red-700">
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Admin Dialog */}
      <Dialog open={createAdminDialogOpen} onOpenChange={setCreateAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Admin User</DialogTitle>
            <DialogDescription>Create a new admin user and assign them a role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newAdminFirstName">First Name</Label>
                <Input
                  id="newAdminFirstName"
                  value={newAdminFirstName}
                  onChange={(e) => setNewAdminFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="newAdminLastName">Last Name</Label>
                <Input
                  id="newAdminLastName"
                  value={newAdminLastName}
                  onChange={(e) => setNewAdminLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="newAdminEmail">Email</Label>
              <Input
                id="newAdminEmail"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <Label htmlFor="newAdminPassword">Password</Label>
              <Input
                id="newAdminPassword"
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Secure password"
              />
            </div>
            <div>
              <Label htmlFor="newAdminRole">Role</Label>
              <select
                id="newAdminRole"
                value={newAdminRoleId}
                onChange={(e) => setNewAdminRoleId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.displayName} - {role.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAdminDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAdmin} className="bg-red-600 hover:bg-red-700">
              Create Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
