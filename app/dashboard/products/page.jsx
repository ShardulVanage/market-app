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
import { Plus, Edit, ArrowLeft } from 'lucide-react';

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
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (isLoading || isFetchingProducts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!currentUser || currentUser.userRole !== "seller") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-red-600">Access denied. Sellers only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => router.push("/dashboard")}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">My Products</h1>
          </div>
          <Button 
            onClick={() => router.push("/dashboard/products/add")}
            disabled={!companyData || companyData.approvalStatus !== "approved"}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {!companyData && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <p className="text-center mb-4">You need to add company details before listing products.</p>
              <Button onClick={() => router.push("/dashboard/company")} className="w-full">
                Add Company Details
              </Button>
            </CardContent>
          </Card>
        )}

        {companyData && companyData.approvalStatus !== "approved" && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <p className="text-center mb-4">
                Your company profile is {companyData.approvalStatus}. 
                You can only list products after admin approval.
              </p>
            </CardContent>
          </Card>
        )}

        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-600 mb-4">No products listed yet.</p>
              {companyData && companyData.approvalStatus === "approved" && (
                <Button onClick={() => router.push("/dashboard/products/add")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={pb.files.getUrl(product, product.images[0]) || "/placeholder.svg"}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={getStatusBadgeVariant(product.approvalStatus)}>
                      {product.approvalStatus}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-lg font-semibold">
                      ₹{product.price} / {product.measurement}
                    </p>
                    <p className="text-sm text-gray-600">
                      Category: {product.category}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(product.created).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                      className="w-full"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit Product
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
