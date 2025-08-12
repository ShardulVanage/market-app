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
import { Plus, Edit, Trash2, Clock, CheckCircle, XCircle, ArrowLeft, MoreVertical } from "lucide-react"
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status) => {
    const variant = status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"
    return (
      <Badge variant={variant} className="text-xs">
        {status}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  const isProfileApproved = currentUser?.profileStatus === "approved"

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Mobile-friendly header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button variant="outline" onClick={() => router.push("/dashboard")} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Requirements</h1>
                <p className="text-gray-600 text-sm sm:text-base">Manage your posted requirements</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/dashboard/requirements/add")}
              disabled={!isProfileApproved}
              className="flex items-center space-x-2 w-full sm:w-auto"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              <span>Post Requirement</span>
            </Button>
          </div>

          {!isProfileApproved && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6 sm:mb-8">
              <p className="text-yellow-800 text-sm sm:text-base">
                Your profile needs to be approved before you can post requirements.
              </p>
            </div>
          )}

          {isFetchingData ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : requirements.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 sm:py-12">
                <p className="text-gray-600 mb-4">No requirements posted yet</p>
                {isProfileApproved && (
                  <Button onClick={() => router.push("/dashboard/requirements/add")} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Post Your First Requirement
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {requirements.map((requirement) => (
                <Card key={requirement.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate">{requirement.quoteFor}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1 truncate">{requirement.category}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(requirement.approvalStatus)}
                          {getStatusBadge(requirement.approvalStatus)}
                        </div>
                        {/* Mobile dropdown menu */}
                        <div className="sm:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
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
                              <DropdownMenuItem onClick={() => handleDelete(requirement.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Details</h4>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">{requirement.requirementDetails}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-gray-600 space-y-1 sm:space-y-0">
                        <span className="truncate">Location: {requirement.location}</span>
                        <span className="text-xs sm:text-sm">
                          Posted: {new Date(requirement.created).toLocaleDateString()}
                        </span>
                      </div>

                      {requirement.attachment && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 text-sm">Attachment</h4>
                          <a
                            href={pb.files.getUrl(requirement, requirement.attachment)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View Attachment
                          </a>
                        </div>
                      )}

                      {/* Desktop action buttons */}
                      <div className="hidden sm:flex justify-end space-x-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/requirements/edit/${requirement.id}`)}
                          disabled={requirement.approvalStatus === "approved"}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(requirement.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
