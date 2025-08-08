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
      const timestamp = new Date().getTime();
      const record = await pb.collection("companies").getFirstListItem(`user="${currentUser.id}"`, {
        requestKey: `dashboard-company-fetch-${currentUser.id}-${timestamp}`,
      });
      setCompanyData(record);
    } catch (err) {
      if (err.status === 404) {
        setCompanyData(null); // No company found for this user
      } else {
        console.error("Failed to fetch company details:", err);
      }
    } finally {
      setIsFetchingCompany(false);
    }
  }, [currentUser, pb]);

  // Only fetch once when the component mounts or when currentUser changes
  useEffect(() => {
    if (currentUser?.id) {
      fetchCompanyDetails();
    }
  }, [currentUser?.id, fetchCompanyDetails]);

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
              <h2 className="text-xl font-semibold">Welcome, {currentUser.firstName || currentUser.email}!</h2>
              <p className="text-gray-600">Your role: {currentUser.userRole}</p>
            </div>

            {!isEmailVerified && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                <p className="font-bold">Email Not Verified</p>
                <p>Please verify your email to access all features.</p>
                <Button onClick={() => router.push("/verify-otp")} className="mt-2"> {/* Changed to /verify-otp */}
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
                        </div>
                      ) : (
                        <p>No company details added yet. Please add your company information.</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            {/* Moved Logout button outside the conditional block */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold">Other Actions</h3>
              <Button onClick={handleLogout} variant="destructive" className="mt-2">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
