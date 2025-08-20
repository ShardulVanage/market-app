"use client";

import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import ProfileForm from "@/components/profile-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DashboardProfilePage() {
  const router = useRouter();

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="min-h-screen bg-white">
        {/* Header Navigation */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Button 
              onClick={() => router.push("/dashboard")} 
              variant="ghost"
              className="text-gray-600 hover:text-[#29688A] hover:bg-[#29688A]/5 px-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <ProfileForm />
        </div>
      </div>
    </AuthGuard>
  );
}