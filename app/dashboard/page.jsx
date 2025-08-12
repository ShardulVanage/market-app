"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import AuthGuard from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import LoadingSpinner from "@/components/ui/loading-spinner"
import MembershipDialog from "@/components/membership-dialog"
import { getClientPb } from "@/lib/pocketbase"
import {
  User,
  Building2,
  Package,
  Plus,
  Edit,
  LogOut,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  AlertTriangle,
  TrendingUp,
  Eye,
  Crown,
} from "lucide-react"
import { MessageSquare, FileText } from "lucide-react"

export default function DashboardPage() {
  const { currentUser, isLoading, logout } = useAuth()
  const router = useRouter()
  const pb = getClientPb()

  const [companyData, setCompanyData] = useState(null)
  const [productsData, setProductsData] = useState([])
  const [isFetchingData, setIsFetchingData] = useState(true)
  const [showMembershipDialog, setShowMembershipDialog] = useState(false)
  const [stats, setStats] = useState({
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    rejectedProducts: 0,
  })
  const [recentRequirements, setRecentRequirements] = useState([])
  const [recentInquiries, setRecentInquiries] = useState([])

  // Check if user has active membership
  const hasActiveMembership = currentUser?.membershipStatus === "active"
  const isEmailVerified = currentUser?.verified === true
  const isProfileApproved = currentUser?.profileStatus === "approved"

  const fetchDashboardData = useCallback(
    async (signal) => {
      if (!currentUser?.id || !pb.authStore.isValid) {
        setIsFetchingData(false)
        return
      }

      try {
        // Fetch company data for sellers
        if (currentUser?.userRole === "seller") {
          try {
            const company = await pb.collection("companies").getFirstListItem(`user="${currentUser.id}"`, { signal })
            setCompanyData(company)
          } catch (error) {
            if (error.name !== "AbortError") {
              console.log("No company data found")
              setCompanyData(null)
            }
          }

          // Fetch products data
          try {
            const products = await pb.collection("products").getFullList({
              filter: `user="${currentUser.id}"`,
              sort: "-created",
              signal,
            })
            setProductsData(products)

            // Calculate stats
            const stats = products.reduce(
              (acc, product) => {
                acc.totalProducts++
                if (product.approvalStatus === "approved") acc.approvedProducts++
                else if (product.approvalStatus === "pending") acc.pendingProducts++
                else if (product.approvalStatus === "rejected") acc.rejectedProducts++
                return acc
              },
              { totalProducts: 0, approvedProducts: 0, pendingProducts: 0, rejectedProducts: 0 },
            )
            setStats(stats)
          } catch (error) {
            if (error.name !== "AbortError") {
              console.log("No products found")
              setProductsData([])
            }
          }
        }

        // Fetch recent requirements
        try {
          const requirements = await pb.collection("requirements").getFullList({
            filter: `user="${currentUser.id}"`,
            sort: "-created",
            limit: 5,
            signal,
          })
          setRecentRequirements(requirements)
        } catch (error) {
          if (error.name !== "AbortError") {
            console.log("No requirements found")
            setRecentRequirements([])
          }
        }

        // Fetch recent inquiries
        try {
          const inquiries = await pb.collection("inquiries").getFullList({
            filter: `buyer="${currentUser.id}" || seller="${currentUser.id}"`,
            sort: "-created",
            limit: 5,
            expand: "buyer,seller,product,requirement",
            signal,
          })
          setRecentInquiries(inquiries)
        } catch (error) {
          if (error.name !== "AbortError") {
            console.log("No inquiries found")
            setRecentInquiries([])
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching dashboard data:", error)
        }
      } finally {
        setIsFetchingData(false)
      }
    },
    [currentUser?.id, currentUser?.userRole, pb],
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchDashboardData(controller.signal)
    return () => controller.abort()
  }, [fetchDashboardData])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (isLoading || isFetchingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const canListProducts = currentUser?.userRole === "seller" && companyData?.approvalStatus === "approved"

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {currentUser?.firstName || currentUser?.email || "User"}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-sm">
                  {currentUser?.userRole || "Loading..."}
                </Badge>
                {hasActiveMembership ? (
                  <Badge className="bg-green-500 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Member
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    non member
                  </Badge>
                )}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 bg-transparent"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Status Alerts */}
          <div className="space-y-4 mb-8">
            {!hasActiveMembership && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Crown className="w-5 h-5 text-blue-400 mr-3" />
                    <div>
                      <p className="font-medium text-blue-800">Upgrade to Premium Membership</p>
                      <p className="text-blue-700 text-sm">
                        Unlock advanced features, priority support, and enhanced visibility for your business.
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setShowMembershipDialog(true)} className="ml-4 bg-blue-600 hover:bg-blue-700">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </div>
            )}

            {!isEmailVerified && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-yellow-400 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800">Email Not Verified</p>
                    <p className="text-yellow-700 text-sm">Please verify your email to access all features.</p>
                  </div>
                  <Button onClick={() => router.push("/verify-otp")} size="sm" className="ml-4">
                    Verify Now
                  </Button>
                </div>
              </div>
            )}
            {isEmailVerified && !isProfileApproved && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-400 mr-3" />
                  <div>
                    <p className="font-medium text-blue-800">Profile Under Review</p>
                    <p className="text-blue-700 text-sm">
                      Your profile is currently under review by an admin. Typically takes up to 48 hours.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards for Sellers */}
          {currentUser?.userRole === "seller" && companyData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Products</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-3xl font-bold text-green-600">{stats.approvedProducts}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.pendingProducts}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejected</p>
                      <p className="text-3xl font-bold text-red-600">{stats.rejectedProducts}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEmailVerified && isProfileApproved ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button
                        onClick={() => router.push("/dashboard/profile")}
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center space-y-2"
                      >
                        <User className="w-6 h-6" />
                        <span>Edit Profile</span>
                      </Button>
                      {currentUser?.userRole === "seller" && hasActiveMembership && (
                        <>
                          <Button
                            onClick={() => router.push("/dashboard/company")}
                            variant="outline"
                            className="h-20 flex flex-col items-center justify-center space-y-2"
                          >
                            <Building2 className="w-6 h-6" />
                            <span>{companyData ? "Edit Company" : "Add Company"}</span>
                          </Button>
                          <Button
                            onClick={() => router.push("/dashboard/products")}
                            variant="outline"
                            className="h-20 flex flex-col items-center justify-center space-y-2"
                          >
                            <Package className="w-6 h-6" />
                            <span>Manage Products</span>
                          </Button>
                          <Button
                            onClick={() => router.push("/dashboard/products/add")}
                            disabled={!canListProducts}
                            className="h-20 flex flex-col items-center justify-center space-y-2"
                          >
                            <Plus className="w-6 h-6" />
                            <span>Add Product</span>
                          </Button>
                        </>
                      )}
                      {hasActiveMembership && (
                        <>
                          <Button
                            onClick={() => router.push("/dashboard/requirements")}
                            variant="outline"
                            className="h-20 flex flex-col items-center justify-center space-y-2"
                          >
                            <FileText className="w-6 h-6" />
                            <span>Requirements</span>
                          </Button>
                          <Button
                            onClick={() => router.push("/dashboard/inquiries")}
                            variant="outline"
                            className="h-20 flex flex-col items-center justify-center space-y-2"
                          >
                            <MessageSquare className="w-6 h-6" />
                            <span>Inquiries</span>
                          </Button>
                        </>
                      )}
                      {!hasActiveMembership && (
                        <div className="col-span-full">
                          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">Upgrade to access premium features</p>
                            <Button
                              onClick={() => setShowMembershipDialog(true)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Crown className="w-4 h-4 mr-2" />
                              View Plans
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <p className="text-gray-600">Complete your profile setup to access all features.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Company Status / Profile Info */}
            <div>
              {currentUser?.userRole === "seller" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Company Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isFetchingData ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : companyData ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Company Name</p>
                          <p className="font-medium">{companyData.companyName}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge
                            variant={
                              companyData.approvalStatus === "approved"
                                ? "default"
                                : companyData.approvalStatus === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="mt-1"
                          >
                            {companyData.approvalStatus}
                          </Badge>
                        </div>
                        {companyData.approvalStatus === "pending" && (
                          <p className="text-sm text-blue-600">Awaiting admin approval</p>
                        )}
                        {companyData.approvalStatus === "rejected" && (
                          <p className="text-sm text-red-600">Please review and re-submit</p>
                        )}
                        {companyData.website && (
                          <div>
                            <p className="text-sm text-gray-600">Website</p>
                            <a
                              href={companyData.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {companyData.website}
                            </a>
                          </div>
                        )}
                        {hasActiveMembership && (
                          <Button
                            onClick={() => router.push("/dashboard/company")}
                            variant="outline"
                            size="sm"
                            className="w-full mt-4"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Details
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4 text-sm">No company details added yet</p>
                        {hasActiveMembership && (
                          <Button onClick={() => router.push("/dashboard/company")} size="sm" className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Company Details
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Profile Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{currentUser?.email || "Loading..."}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <Badge variant="outline" className="mt-1">
                          {currentUser?.userRole || "Loading..."}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <Badge variant={isProfileApproved ? "default" : "secondary"} className="mt-1">
                          {isProfileApproved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => router.push("/dashboard/profile")}
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Recent Products for Sellers - Only show if has membership */}
          {currentUser?.userRole === "seller" && hasActiveMembership && productsData.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Recent Products
                  </CardTitle>
                  <Button onClick={() => router.push("/dashboard/products")} variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productsData.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={pb.files.getUrl(product, product.images[0]) || "/placeholder.svg"}
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-gray-600">
                            ₹{product.price} / {product.measurement}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          product.approvalStatus === "approved"
                            ? "default"
                            : product.approvalStatus === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {product.approvalStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Requirements - Only show if has membership */}
          {hasActiveMembership && recentRequirements.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Recent Requirements
                  </CardTitle>
                  <Button onClick={() => router.push("/dashboard/requirements")} variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentRequirements.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <FileText className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">{req.quoteFor}</p>
                          <p className="text-sm text-gray-600">{req.category}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          req.approvalStatus === "approved"
                            ? "default"
                            : req.approvalStatus === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {req.approvalStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Inquiries - Only show if has membership */}
          {hasActiveMembership && recentInquiries.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Recent Inquiries
                  </CardTitle>
                  <Button onClick={() => router.push("/dashboard/inquiries")} variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInquiries.map((inquiry) => {
                    const isProduct = !!inquiry.product
                    const targetUser =
                      inquiry.buyer === currentUser?.id ? inquiry.expand?.seller : inquiry.expand?.buyer
                    const targetItem = isProduct ? inquiry.expand?.product : inquiry.expand?.requirement
                    const inquiryType = inquiry.buyer === currentUser?.id ? "Sent" : "Received"

                    return (
                      <div key={inquiry.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          {isProduct ? (
                            <Package className="w-5 h-5 text-blue-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-green-600" />
                          )}
                          <div>
                            <p className="font-medium">
                              {inquiryType} Inquiry for {targetItem?.title || targetItem?.quoteFor}
                            </p>
                            <p className="text-sm text-gray-600">
                              {inquiryType === "Sent" ? "To" : "From"}: {targetUser?.firstName} {targetUser?.lastName}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            inquiry.status === "replied"
                              ? "default"
                              : inquiry.status === "closed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {inquiry.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <MembershipDialog open={showMembershipDialog} onOpenChange={setShowMembershipDialog} />
      </div>
    </AuthGuard>
  )
}
