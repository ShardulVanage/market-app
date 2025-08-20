"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { getClientPb } from "@/lib/pocketbase";
import { 
  Plus, 
  Edit, 
  ArrowLeft, 
  Package, 
  Building2, 
  Clock, 
  Tag, 
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';

export default function ProductsPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const pb = getClientPb();

  const [products, setProducts] = useState([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);
  const [companyData, setCompanyData] = useState(null);

  // Fetch company and products
  const fetchData = useCallback(async (signal) => {
    if (!currentUser?.id || !pb.authStore.isValid || currentUser.userRole !== "seller") {
      setIsFetchingProducts(false);
      return;
    }

    setIsFetchingProducts(true);
    
    try {
      // Fetch company data
      const company = await pb.collection("companies").getFirstListItem(
        `user="${currentUser.id}"`,
        { signal }
      );
      setCompanyData(company);

      // Fetch products
      const productsList = await pb.collection("products").getList(1, 50, {
        filter: `seller="${currentUser.id}"`,
        sort: "-created",
        expand: "company",
        signal
      });
      setProducts(productsList.items);
    } catch (err) {
      // Handle auto-cancellation gracefully
      if (err.name === 'AbortError' || err.message?.includes('autocancelled')) {
        console.log("Request was cancelled, this is normal when navigating quickly");
        return;
      }
      
      if (err.status === 404) {
        setCompanyData(null);
        setProducts([]);
      } else {
        console.error("Failed to fetch data:", err);
      }
    } finally {
      setIsFetchingProducts(false);
    }
  }, [currentUser, pb]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const controller = new AbortController();
    
    const timeout = setTimeout(() => {
      fetchData(controller.signal);
    }, 100);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [currentUser?.id, fetchData]);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "approved":
        return { variant: "default", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle };
      case "pending":
        return { variant: "secondary", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock };
      case "rejected":
        return { variant: "destructive", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle };
      default:
        return { variant: "outline", color: "bg-gray-100 text-gray-700 border-gray-200", icon: AlertCircle };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  };

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse border border-gray-100">
            <div className="aspect-video bg-gray-100"></div>
            <div className="p-6 space-y-3">
              <div className="h-5 bg-gray-100 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-full"></div>
              <div className="h-6 bg-gray-100 rounded w-1/2"></div>
              <div className="h-8 bg-gray-100 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-50 rounded-full mb-6">
        <Package className="h-12 w-12 text-gray-300" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">No products yet</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Start building your product catalog by adding your first product listing.
      </p>
      {companyData && companyData.approvalStatus === "approved" && (
        <Button 
          onClick={() => router.push("/dashboard/products/add")}
          className="bg-[#29688A] hover:bg-[#1f4f6b] text-white px-8"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Your First Product
        </Button>
      )}
    </div>
  );

  const StatusCard = ({ type, title, description, action, actionText, actionDisabled }) => {
    const icons = {
      warning: AlertCircle,
      info: Building2
    };
    const Icon = icons[type] || AlertCircle;
    
    return (
      <Card className="border-l-4 border-l-yellow-400 bg-yellow-50/50 border border-yellow-100">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Icon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
              <p className="text-gray-600 text-sm mb-4">{description}</p>
              {action && (
                <Button 
                  onClick={action}
                  disabled={actionDisabled}
                  className="bg-[#29688A] hover:bg-[#1f4f6b] text-white"
                >
                  {actionText}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading || isFetchingProducts) {
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
    );
  }

  if (!currentUser || currentUser.userRole !== "seller") {
    return (
      <AuthGuard redirectIfNotAuthenticated="/login">
        <div className="flex items-center justify-center min-h-screen bg-white">
          <Card className="w-full max-w-md border border-red-200">
            <CardContent className="p-8 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">This page is only accessible to sellers.</p>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  const getProductStats = () => {
    const approved = products.filter(p => p.approvalStatus === 'approved').length;
    const pending = products.filter(p => p.approvalStatus === 'pending').length;
    const rejected = products.filter(p => p.approvalStatus === 'rejected').length;
    return { approved, pending, rejected, total: products.length };
  };

  const stats = getProductStats();

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => router.push("/dashboard")}
                  variant="ghost"
                  className="text-gray-600 hover:text-[#29688A] hover:bg-[#29688A]/5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#29688A] rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">My Products</h1>
                    <p className="text-sm text-gray-600">{stats.total} total products</p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => router.push("/dashboard/products/add")}
                disabled={!companyData || companyData.approvalStatus !== "approved"}
                className="bg-[#29688A] hover:bg-[#1f4f6b] text-white px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            {/* Stats Bar */}
            {products.length > 0 && (
              <div className="flex gap-4 mt-6">
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
          {/* Status Cards */}
          {!companyData && (
            <div className="mb-8">
              <StatusCard
                type="warning"
                title="Company Profile Required"
                description="You need to add your company details before you can list products."
                action={() => router.push("/dashboard/company")}
                actionText="Add Company Details"
              />
            </div>
          )}

          {companyData && companyData.approvalStatus !== "approved" && (
            <div className="mb-8">
              <StatusCard
                type="info"
                title={`Company Profile ${companyData.approvalStatus}`}
                description="You can only list products after your company profile receives admin approval."
              />
            </div>
          )}

          {/* Products Grid */}
          {products.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const statusInfo = getStatusBadgeVariant(product.approvalStatus);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <Card 
                    key={product.id} 
                    className="border border-gray-100 hover:shadow-lg transition-all duration-200 hover:border-[#29688A]/20"
                  >
                    {/* Image Section */}
                    <div className="aspect-video bg-gray-50 relative overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={pb.files.getUrl(product, product.images[0]) || "/placeholder.svg"}
                          alt={product.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {product.approvalStatus}
                        </Badge>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6">
                      {/* Header */}
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {product.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {product.description}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-[#29688A]" />
                            <span className="text-lg font-bold text-[#29688A]">
                              ₹{product.price}
                            </span>
                            <span className="text-sm text-gray-500">/ {product.measurement}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Tag className="h-3 w-3" />
                          <span>{product.category}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>Created {formatDate(product.created)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/product/${product.id}`)}
                          className="flex-1 border-gray-200 hover:border-[#29688A] hover:text-[#29688A]"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                          className="flex-1 bg-[#29688A] hover:bg-[#1f4f6b] text-white"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}