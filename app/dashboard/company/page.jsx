"use client";

import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import CompanyForm from "@/components/company-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function DashboardCompanyPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser) {
      if (currentUser.userRole !== "seller" || currentUser.profileStatus !== "approved") {
        router.push("/dashboard"); // Redirect non-approved sellers or buyers
      }
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || (currentUser && (currentUser.userRole !== "seller" || currentUser.profileStatus !== "approved"))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-4xl mb-4">
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>
        <CompanyForm />
      </div>
    </AuthGuard>
  );
}
