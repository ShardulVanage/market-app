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
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  AlertTriangle,
  TrendingUp,
  Eye,
  Crown,
  Heart,
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

          try {
            const products = await pb.collection("products").getFullList({
              filter: `user="${currentUser.id}"`,
              sort: "-created",
              signal,
            })
            setProductsData(products)

            // Calculate stats properly
            const calculatedStats = {
              totalProducts: products.length,
              approvedProducts: products.filter((p) => p.approvalStatus === "approved").length,
              pendingProducts: products.filter((p) => p.approvalStatus === "pending").length,
              rejectedProducts: products.filter((p) => p.approvalStatus === "rejected").length,
            }
            setStats(calculatedStats)
          } catch (error) {
            if (error.name !== "AbortError") {
              console.log("No products found")
              setProductsData([])
              setStats({
                totalProducts: 0,
                approvedProducts: 0,
                pendingProducts: 0,
                rejectedProducts: 0,
              })
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    )
  }

  const canListProducts = currentUser?.userRole === "seller" && companyData?.approvalStatus === "approved"

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="min-h-screen bg-white">
        <div className="border-b border-gray-100">
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
                <p className="text-gray-500 text-sm">
                  Welcome back, {currentUser?.firstName || currentUser?.email || "User"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-medium border-gray-200 text-gray-600">
                  {currentUser?.userRole || "Loading..."}
                </Badge>
                {hasActiveMembership ? (
                  <Badge className="bg-[#29688A] text-white text-xs font-medium hover:bg-[#29688A]/90">
                    <Crown className="w-3 h-3 mr-1" />
                    Member
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500 border-gray-200 text-xs font-medium">
                    Free Plan
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="space-y-3 mb-8">
            {!hasActiveMembership && (
              <div className="bg-[#29688A]/5 border border-[#29688A]/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-[#29688A]" />
                    <div>
                      <p className="font-medium text-[#29688A] text-sm">Upgrade to Premium</p>
                      <p className="text-[#29688A]/70 text-xs">Unlock advanced features and enhanced visibility</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowMembershipDialog(true)}
                    size="sm"
                    className="bg-[#29688A] hover:bg-[#29688A]/90 text-white text-xs"
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    Upgrade
                  </Button>
                </div>
              </div>
            )}

            {!isEmailVerified && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800 text-sm">Email Verification Required</p>
                      <p className="text-amber-700 text-xs">Verify your email to access all features</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push("/verify-otp")}
                    size="sm"
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs"
                  >
                    Verify
                  </Button>
                </div>
              </div>
            )}

            {isEmailVerified && !isProfileApproved && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800 text-sm">Profile Under Review</p>
                    <p className="text-blue-700 text-xs">Typically takes up to 48 hours</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {currentUser?.userRole === "seller" && companyData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Products</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.totalProducts}</p>
                    </div>
                    <div className="w-10 h-10 bg-[#29688A]/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-[#29688A]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approved</p>
                      <p className="text-2xl font-semibold text-emerald-600 mt-1">{stats.approvedProducts}</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending</p>
                      <p className="text-2xl font-semibold text-amber-600 mt-1">{stats.pendingProducts}</p>
                    </div>
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejected</p>
                      <p className="text-2xl font-semibold text-red-600 mt-1">{stats.rejectedProducts}</p>
                    </div>
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                    <TrendingUp className="w-5 h-5 mr-2 text-[#29688A]" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEmailVerified && isProfileApproved ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        onClick={() => router.push("/dashboard/profile")}
                        variant="outline"
                        className="h-16 flex flex-col items-center justify-center gap-2 border-gray-200 hover:border-[#29688A] hover:bg-[#29688A]/5 transition-colors"
                      >
                        <User className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium">Edit Profile</span>
                      </Button>

                      <Button
                        onClick={() => router.push("/dashboard/favorites")}
                        variant="outline"
                        className="h-16 flex flex-col items-center justify-center gap-2 border-gray-200 hover:border-[#29688A] hover:bg-[#29688A]/5 transition-colors"
                      >
                        <Heart className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium">My Favorites</span>
                      </Button>

                      {currentUser?.userRole === "seller" && hasActiveMembership && (
                        <>
                          <Button
                            onClick={() => router.push("/dashboard/company")}
                            variant="outline"
                            className="h-16 flex flex-col items-center justify-center gap-2 border-gray-200 hover:border-[#29688A] hover:bg-[#29688A]/5 transition-colors"
                          >
                            <Building2 className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-medium">{companyData ? "Edit Company" : "Add Company"}</span>
                          </Button>

                          <Button
                            onClick={() => router.push("/dashboard/products")}
                            variant="outline"
                            className="h-16 flex flex-col items-center justify-center gap-2 border-gray-200 hover:border-[#29688A] hover:bg-[#29688A]/5 transition-colors"
                          >
                            <Package className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-medium">Manage Products</span>
                          </Button>

                          <Button
                            onClick={() => router.push("/dashboard/products/add")}
                            disabled={!canListProducts}
                            className="h-16 flex flex-col items-center justify-center gap-2 bg-[#29688A] hover:bg-[#29688A]/90 text-white"
                          >
                            <Plus className="w-5 h-5" />
                            <span className="text-sm font-medium">Add Product</span>
                          </Button>
                        </>
                      )}

                      {hasActiveMembership && (
                        <>
                          <Button
                            onClick={() => router.push("/dashboard/requirements")}
                            variant="outline"
                            className="h-16 flex flex-col items-center justify-center gap-2 border-gray-200 hover:border-[#29688A] hover:bg-[#29688A]/5 transition-colors"
                          >
                            <FileText className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-medium">Requirements</span>
                          </Button>

                          <Button
                            onClick={() => router.push("/dashboard/inquiries")}
                            variant="outline"
                            className="h-16 flex flex-col items-center justify-center gap-2 border-gray-200 hover:border-[#29688A] hover:bg-[#29688A]/5 transition-colors"
                          >
                            <MessageSquare className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-medium">Inquiries</span>
                          </Button>
                        </>
                      )}

                      {!hasActiveMembership && (
                        <div className="col-span-full">
                          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <Crown className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 mb-4 text-sm">Upgrade to access premium features</p>
                            <Button
                              onClick={() => setShowMembershipDialog(true)}
                              className="bg-[#29688A] hover:bg-[#29688A]/90 text-white text-sm"
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
                      <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                      <p className="text-gray-600 text-sm">Complete your profile setup to access all features</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              {currentUser?.userRole === "seller" ? (
                <Card className="border-gray-100 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                      <Building2 className="w-5 h-5 mr-2 text-[#29688A]" />
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
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Company Name</p>
                          <p className="font-medium text-gray-900 mt-1">{companyData.companyName}</p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                          <Badge
                            variant={
                              companyData.approvalStatus === "approved"
                                ? "default"
                                : companyData.approvalStatus === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className={`mt-1 text-xs ${
                              companyData.approvalStatus === "approved" ? "bg-[#29688A] text-white" : ""
                            }`}
                          >
                            {companyData.approvalStatus}
                          </Badge>
                        </div>

                        {companyData.approvalStatus === "pending" && (
                          <p className="text-xs text-[#29688A]">Awaiting admin approval</p>
                        )}
                        {companyData.approvalStatus === "rejected" && (
                          <p className="text-xs text-red-600">Please review and re-submit</p>
                        )}

                        {companyData.website && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Website</p>
                            <a
                              href={companyData.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#29688A] hover:underline text-sm mt-1 block"
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
                            className="w-full mt-4 border-gray-200 hover:border-[#29688A] hover:bg-[#29688A]/5"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Details
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Building2 className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4 text-sm">No company details added yet</p>
                        {hasActiveMembership && (
                          <Button
                            onClick={() => router.push("/dashboard/company")}
                            size="sm"
                            className="w-full bg-[#29688A] hover:bg-[#29688A]/90 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Company Details
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-gray-100 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                      <User className="w-5 h-5 mr-2 text-[#29688A]" />
                      Profile Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                        <p className="font-medium text-gray-900 mt-1">{currentUser?.email || "Loading..."}</p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</p>
                        <Badge variant="outline" className="mt-1 text-xs border-gray-200">
                          {currentUser?.userRole || "Loading..."}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                        <Badge
                          variant={isProfileApproved ? "default" : "secondary"}
                          className={`mt-1 text-xs ${isProfileApproved ? "bg-[#29688A] text-white" : ""}`}
                        >
                          {isProfileApproved ? "Approved" : "Pending"}
                        </Badge>
                      </div>

                      <Button
                        onClick={() => router.push("/dashboard/profile")}
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 border-gray-200 hover:border-[#29688A] hover:bg-[#29688A]/5"
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

          {currentUser?.userRole === "seller" && hasActiveMembership && productsData.length > 0 && (
            <Card className="mt-6 border-gray-100 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                    <Package className="w-5 h-5 mr-2 text-[#29688A]" />
                    Recent Products
                  </CardTitle>
                  <Button
                    onClick={() => router.push("/dashboard/products")}
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:border-[#29688A] hover:bg-[#29688A]/5 text-xs"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productsData.slice(0, 3).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={pb.files.getUrl(product, product.images[0]) || "/placeholder.svg"}
                            alt={product.title}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{product.title}</p>
                          <p className="text-xs text-gray-500">
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
                        className={`text-xs ${product.approvalStatus === "approved" ? "bg-[#29688A] text-white" : ""}`}
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
            <Card className="mt-6 border-gray-100 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                    <FileText className="w-5 h-5 mr-2 text-[#29688A]" />
                    Recent Requirements
                  </CardTitle>
                  <Button
                    onClick={() => router.push("/dashboard/requirements")}
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:border-[#29688A] hover:bg-[#29688A]/5 text-xs"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentRequirements.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{req.quoteFor}</p>
                          <p className="text-xs text-gray-500">{req.category}</p>
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
                        className={`text-xs ${req.approvalStatus === "approved" ? "bg-[#29688A] text-white" : ""}`}
                      >
                        {req.approvalStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasActiveMembership && recentInquiries.length > 0 && (
            <Card className="mt-6 border-gray-100 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                    <MessageSquare className="w-5 h-5 mr-2 text-[#29688A]" />
                    Recent Inquiries
                  </CardTitle>
                  <Button
                    onClick={() => router.push("/dashboard/inquiries")}
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:border-[#29688A] hover:bg-[#29688A]/5 text-xs"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentInquiries.map((inquiry) => {
                    const isProduct = !!inquiry.product
                    const targetUser =
                      inquiry.buyer === currentUser?.id ? inquiry.expand?.seller : inquiry.expand?.buyer
                    const targetItem = isProduct ? inquiry.expand?.product : inquiry.expand?.requirement
                    const inquiryType = inquiry.buyer === currentUser?.id ? "Sent" : "Received"

                    return (
                      <div
                        key={inquiry.id}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isProduct ? "bg-[#29688A]/10" : "bg-emerald-50"
                            }`}
                          >
                            {isProduct ? (
                              <Package className="w-5 h-5 text-[#29688A]" />
                            ) : (
                              <FileText className="w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {inquiryType} Inquiry for {targetItem?.title || targetItem?.quoteFor}
                            </p>
                            <p className="text-xs text-gray-500">
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
                          className={`text-xs ${inquiry.status === "replied" ? "bg-[#29688A] text-white" : ""}`}
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
