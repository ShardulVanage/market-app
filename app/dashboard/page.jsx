"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { getClientPb } from "@/lib/pocketbase";
import { User, Building2, Package, Plus, Edit, LogOut, CheckCircle, Clock, XCircle, Mail, AlertTriangle, TrendingUp, Eye } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, isLoading, logout } = useAuth();
  const router = useRouter();
  const pb = getClientPb();
  
  const [companyData, setCompanyData] = useState(null);
  const [productsData, setProductsData] = useState([]);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    rejectedProducts: 0
  });

  const fetchDashboardData = useCallback(async (signal) => {
    if (!currentUser?.id || !pb.authStore.isValid) {
      setIsFetchingData(false);
      return;
    }

    setIsFetchingData(true);
    
    try {
      // Fetch company data if seller
      if (currentUser.userRole === "seller") {
        try {
          const company = await pb.collection("companies").getFirstListItem(
            `user="${currentUser.id}"`,
            { signal }
          );
          setCompanyData(company);

          // Fetch products for stats
          const products = await pb.collection("products").getList(1, 50, {
            filter: `seller="${currentUser.id}"`,
            sort: "-created",
            signal
          });
          
          setProductsData(products.items);
          
          // Calculate stats
          const totalProducts = products.items.length;
          const approvedProducts = products.items.filter(p => p.approvalStatus === "approved").length;
          const pendingProducts = products.items.filter(p => p.approvalStatus === "pending").length;
          const rejectedProducts = products.items.filter(p => p.approvalStatus === "rejected").length;
          
          setStats({
            totalProducts,
            approvedProducts,
            pendingProducts,
            rejectedProducts
          });
        } catch (err) {
          if (err.name === 'AbortError' || err.message?.includes('autocancelled')) {
            return;
          }
          if (err.status === 404) {
            setCompanyData(null);
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('autocancelled')) {
        console.log("Request was cancelled, this is normal when navigating quickly");
        return;
      }
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setIsFetchingData(false);
    }
  }, [currentUser, pb]);

  useEffect(() => {
    if (!currentUser?.id) {
      setIsFetchingData(false);
      return;
    }

    const controller = new AbortController();
    
    const timeout = setTimeout(() => {
      fetchDashboardData(controller.signal);
    }, 100);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [currentUser?.id, fetchDashboardData]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const isEmailVerified = currentUser.verified;
  const isProfileApproved = currentUser.profileStatus === "approved";
  const canListProducts = currentUser.userRole === "seller" && companyData?.approvalStatus === "approved";

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">
                  Welcome back, {currentUser.firstName || currentUser.email}!
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-sm">
                  {currentUser.userRole}
                </Badge>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
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
            {!isEmailVerified && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-yellow-400 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800">Email Not Verified</p>
                    <p className="text-yellow-700 text-sm">Please verify your email to access all features.</p>
                  </div>
                  <Button 
                    onClick={() => router.push("/verify-otp")} 
                    size="sm"
                    className="ml-4"
                  >
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
                    <p className="text-blue-700 text-sm">Your profile is currently under review by an admin. Typically takes up to 48 hours.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards for Sellers */}
          {currentUser.userRole === "seller" && companyData && (
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

                      {currentUser.userRole === "seller" && (
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
              {currentUser.userRole === "seller" ? (
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
                              companyData.approvalStatus === "approved" ? "default" :
                              companyData.approvalStatus === "rejected" ? "destructive" : "secondary"
                            }
                            className="mt-1"
                          >
                            {companyData.approvalStatus}
                          </Badge>
                        </div>

                        {companyData.approvalStatus === "pending" && (
                          <p className="text-sm text-blue-600">
                            Awaiting admin approval
                          </p>
                        )}

                        {companyData.approvalStatus === "rejected" && (
                          <p className="text-sm text-red-600">
                            Please review and re-submit
                          </p>
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

                        <Button
                          onClick={() => router.push("/dashboard/company")}
                          variant="outline"
                          size="sm"
                          className="w-full mt-4"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Details
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4 text-sm">
                          No company details added yet
                        </p>
                        <Button
                          onClick={() => router.push("/dashboard/company")}
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Company Details
                        </Button>
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
                        <p className="font-medium">{currentUser.email}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <Badge variant="outline" className="mt-1">
                          {currentUser.userRole}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <Badge 
                          variant={isProfileApproved ? "default" : "secondary"}
                          className="mt-1"
                        >
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

          {/* Recent Products for Sellers */}
          {currentUser.userRole === "seller" && productsData.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Recent Products
                  </CardTitle>
                  <Button
                    onClick={() => router.push("/dashboard/products")}
                    variant="outline"
                    size="sm"
                  >
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
                          <p className="text-sm text-gray-600">₹{product.price} / {product.measurement}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          product.approvalStatus === "approved" ? "default" :
                          product.approvalStatus === "rejected" ? "destructive" : "secondary"
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
        </div>
      </div>
    </AuthGuard>
  );
}
