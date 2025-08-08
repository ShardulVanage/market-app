"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { getClientPb } from "@/lib/pocketbase";

export default function DashboardPage() {
  const { currentUser, isLoading, logout, refreshAuth } = useAuth();
  const router = useRouter();
  const pb = getClientPb();
  
  const [companyData, setCompanyData] = useState(null);
  const [isFetchingCompany, setIsFetchingCompany] = useState(true);
  const [fetchTimeout, setFetchTimeout] = useState(null);

  const fetchCompanyDetails = useCallback(async () => {
    if (!currentUser?.id || !pb.authStore.isValid) {
      setCompanyData(null);
      setIsFetchingCompany(false);
      return;
    }

    if (currentUser.userRole !== "seller") {
      setCompanyData(null);
      setIsFetchingCompany(false);
      return;
    }

    setIsFetchingCompany(true);
    
    try {
      // Remove requestKey to avoid auto-cancellation issues
      const record = await pb.collection("companies").getFirstListItem(
        `user="${currentUser.id}"`
      );
      setCompanyData(record);
    } catch (err) {
      // Handle auto-cancellation gracefully
      if (err.isAbort || err.name === 'AbortError' || err.message?.includes('autocancelled')) {
        console.log("Request was cancelled, this is normal when navigating quickly");
        return; // Don't show error for cancelled requests
      }
      
      if (err.status === 404) {
        setCompanyData(null); // No company found for this user
      } else {
        console.error("Failed to fetch company details:", err);
      }
    } finally {
      setIsFetchingCompany(false);
    }
  }, [currentUser, pb]);

  // Debounced effect to prevent rapid successive requests
  useEffect(() => {
    // Clear any existing timeout
    if (fetchTimeout) {
      clearTimeout(fetchTimeout);
    }

    // Only fetch if we have a current user
    if (currentUser?.id) {
      // Debounce the fetch call to prevent rapid successive requests
      const timeout = setTimeout(() => {
        fetchCompanyDetails();
      }, 100); // 100ms debounce
      
      setFetchTimeout(timeout);
      
      // Cleanup timeout
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    } else {
      setIsFetchingCompany(false);
    }
  }, [currentUser?.id, fetchCompanyDetails]);

  // Cleanup function to cancel any pending requests when component unmounts
  useEffect(() => {
    return () => {
      // Cancel any pending PocketBase requests
      if (pb?.cancelAllRequests) {
        pb.cancelAllRequests();
      }
      // Clear any pending timeouts
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
    };
  }, [pb, fetchTimeout]);

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
    return null; // AuthGuard will redirect
  }

  const isEmailVerified = currentUser.verified;
  const isProfileApproved = currentUser.profileStatus === "approved";

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                Welcome, {currentUser.firstName || currentUser.email}!
              </h2>
              <p className="text-gray-600">Your role: {currentUser.userRole}</p>
            </div>

            {!isEmailVerified && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                <p className="font-bold">Email Not Verified</p>
                <p>Please verify your email to access all features.</p>
                <Button onClick={() => router.push("/verify-otp")} className="mt-2">
                  Verify Email Now
                </Button>
              </div>
            )}

            {isEmailVerified && !isProfileApproved && (
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
                <p className="font-bold">Profile Under Review</p>
                <p>Your profile is currently under review by an admin. You will be notified once it's approved.</p>
                <p className="text-sm mt-1">Typically, this takes up to 48 hours.</p>
              </div>
            )}

            {isEmailVerified && isProfileApproved && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => router.push("/dashboard/profile")}>
                    Edit Profile
                  </Button>
                  {currentUser.userRole === "seller" && (
                    <Button onClick={() => router.push("/dashboard/company")}>
                      {companyData ? "Edit Company Details" : "Add Company Details"}
                    </Button>
                  )}
                </div>

                {currentUser.userRole === "seller" && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-xl">Your Company Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isFetchingCompany ? (
                        <div className="flex justify-center">
                          <LoadingSpinner />
                        </div>
                      ) : companyData ? (
                        <div className="space-y-2">
                          <p>
                            <strong>Company Name:</strong> {companyData.companyName}
                          </p>
                          <p>
                            <strong>Approval Status:</strong>{" "}
                            <span
                              className={`font-semibold ${
                                companyData.approvalStatus === "approved"
                                  ? "text-green-600"
                                  : companyData.approvalStatus === "rejected"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {companyData.approvalStatus}
                            </span>
                          </p>
                          {companyData.approvalStatus === "pending" && (
                            <p className="text-sm text-blue-700">
                              Your company details are awaiting admin approval.
                            </p>
                          )}
                          {companyData.approvalStatus === "rejected" && (
                            <p className="text-sm text-red-700">
                              Your company details were rejected. Please review and re-submit.
                            </p>
                          )}
                          {companyData.description && (
                            <p>
                              <strong>Description:</strong> {companyData.description.substring(0, 100)}
                              {companyData.description.length > 100 ? "..." : ""}
                            </p>
                          )}
                          {companyData.website && (
                            <p>
                              <strong>Website:</strong>{" "}
                              <a 
                                href={companyData.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {companyData.website}
                              </a>
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-600 mb-3">
                            No company details added yet. Please add your company information.
                          </p>
                          <Button 
                            onClick={() => router.push("/dashboard/company")}
                            variant="outline"
                          >
                            Add Company Details
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Other Actions - Always visible */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-3">Other Actions</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                {/* <Button 
                  onClick={() => refreshAuth()} 
                  variant="outline"
                  className="flex-1"
                >
                  Refresh Account Status
                </Button> */}
                <Button 
                  onClick={handleLogout} 
                  variant="destructive" 
                  className="flex-1"
                >
                  Logout
                </Button>
              </div>
            </div>  
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
