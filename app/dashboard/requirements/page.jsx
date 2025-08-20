"use client"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import AuthGuard from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { getClientPb } from "@/lib/pocketbase"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  MoreVertical,
  FileText,
  MapPin,
  Calendar,
  AlertCircle,
  Paperclip,
  ClipboardList
} from "lucide-react"
import { usePocketBaseFetch } from "@/hooks/use-pocketbase-fetch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function RequirementsPage() {
  const { currentUser, isLoading } = useAuth()
  const router = useRouter()
  const pb = getClientPb()

  const [requirements, setRequirements] = useState([])
  const [isFetchingData, setIsFetchingData] = useState(true)

  const fetchRequirements = useCallback(
    async (signal) => {
      if (!currentUser?.id || !pb.authStore.isValid) {
        setIsFetchingData(false)
        return
      }

      setIsFetchingData(true)
      try {
        const records = await pb.collection("requirements").getList(1, 50, {
          filter: `user="${currentUser.id}"`,
          sort: "-created",
          signal,
        })
        setRequirements(records.items)
      } catch (err) {
        if (err.name === "AbortError" || err.message?.includes("autocancelled")) {
          return
        }
        console.error("Failed to fetch requirements:", err)
      } finally {
        setIsFetchingData(false)
      }
    },
    [currentUser, pb],
  )

  usePocketBaseFetch(fetchRequirements, [currentUser?.id])

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this requirement?")) return

    try {
      await pb.collection("requirements").delete(id)
      setRequirements((prev) => prev.filter((req) => req.id !== id))
    } catch (error) {
      console.error("Failed to delete requirement:", error)
      alert("Failed to delete requirement")
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case "approved":
        return {
          icon: CheckCircle,
          color: "bg-green-100 text-green-700 border-green-200",
          variant: "default"
        }
      case "rejected":
        return {
          icon: XCircle,
          color: "bg-red-100 text-red-700 border-red-200",
          variant: "destructive"
        }
      default:
        return {
          icon: Clock,
          color: "bg-yellow-100 text-yellow-700 border-yellow-200",
          variant: "secondary"
        }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse border border-gray-100">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-gray-100 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-100 rounded w-20"></div>
            </div>
            <div className="h-4 bg-gray-100 rounded w-full"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
          </div>
        </Card>
      ))}
    </div>
  )

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-50 rounded-full mb-6">
        <ClipboardList className="h-12 w-12 text-gray-300" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">No requirements yet</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Start by posting your first requirement to connect with potential suppliers.
      </p>
      {isProfileApproved && (
        <Button 
          onClick={() => router.push("/dashboard/requirements/add")}
          className="bg-[#29688A] hover:bg-[#1f4f6b] text-white px-8"
        >
          <Plus className="w-4 h-4 mr-2" />
          Post Your First Requirement
        </Button>
      )}
    </div>
  )

  const StatusCard = () => (
    <Card className="border-l-4 border-l-yellow-400 bg-yellow-50/50 border border-yellow-100 mb-8">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">Profile Approval Required</h3>
            <p className="text-gray-600 text-sm">
              Your profile needs to be approved before you can post requirements.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <AuthGuard redirectIfNotAuthenticated="/login">
        <div className="min-h-screen bg-white">
          {/* Header */}
          <div className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-6 w-32 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            <LoadingSkeleton />
          </div>
        </div>
      </AuthGuard>
    )
  }

  const isProfileApproved = currentUser?.profileStatus === "approved"

  const getRequirementStats = () => {
    const approved = requirements.filter(r => r.approvalStatus === 'approved').length
    const pending = requirements.filter(r => r.approvalStatus === 'pending').length
    const rejected = requirements.filter(r => r.approvalStatus === 'rejected').length
    return { approved, pending, rejected, total: requirements.length }
  }

  const stats = getRequirementStats()

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-6">
                <Button 
                  variant="ghost" 
                  onClick={() => router.push("/dashboard")}
                  className="text-gray-600 hover:text-[#29688A] hover:bg-[#29688A]/5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#29688A] rounded-full flex items-center justify-center">
                    <ClipboardList className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Requirements</h1>
                    <p className="text-sm text-gray-600">{stats.total} total requirements</p>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => router.push("/dashboard/requirements/add")}
                disabled={!isProfileApproved}
                className="bg-[#29688A] hover:bg-[#1f4f6b] text-white px-6 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post Requirement
              </Button>
            </div>

            {/* Stats Bar */}
            {requirements.length > 0 && (
              <div className="flex gap-4 mt-6 flex-wrap">
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">{stats.approved} Approved</span>
                </div>
                {stats.pending > 0 && (
                  <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">{stats.pending} Pending</span>
                  </div>
                )}
                {stats.rejected > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">{stats.rejected} Rejected</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {!isProfileApproved && <StatusCard />}

          {isFetchingData ? (
            <LoadingSkeleton />
          ) : requirements.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {requirements.map((requirement) => {
                const statusInfo = getStatusInfo(requirement.approvalStatus)
                const StatusIcon = statusInfo.icon

                return (
                  <Card 
                    key={requirement.id} 
                    className="border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-[#29688A]/20"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {requirement.quoteFor}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <FileText className="h-4 w-4" />
                            <span>{requirement.category}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {requirement.approvalStatus}
                          </Badge>
                          
                          {/* Mobile dropdown menu */}
                          <div className="sm:hidden">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/dashboard/requirements/edit/${requirement.id}`)}
                                  disabled={requirement.approvalStatus === "approved"}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(requirement.id)} 
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-4">
                        {/* Description */}
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm mb-2">Requirement Details</h4>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {requirement.requirementDetails}
                          </p>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#29688A]" />
                            <span>{requirement.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#29688A]" />
                            <span>Posted {formatDate(requirement.created)}</span>
                          </div>
                        </div>

                        {/* Attachment */}
                        {requirement.attachment && (
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <Paperclip className="h-4 w-4 text-[#29688A]" />
                            <a
                              href={pb.files.getUrl(requirement, requirement.attachment)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#29688A] hover:text-[#1f4f6b] text-sm font-medium hover:underline"
                            >
                              View Attachment
                            </a>
                          </div>
                        )}

                        {/* Desktop Actions */}
                        <div className="hidden sm:flex justify-end gap-2 pt-4 border-t border-gray-100">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/requirements/edit/${requirement.id}`)}
                            disabled={requirement.approvalStatus === "approved"}
                            className="border-gray-200 hover:border-[#29688A] hover:text-[#29688A]"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(requirement.id)}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}