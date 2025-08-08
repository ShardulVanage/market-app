"use client";

import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import ProfileForm from "@/components/profile-form";
import { Button } from "@/components/ui/button";

export default function DashboardProfilePage() {
  const router = useRouter();

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-2xl mb-4">
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>
        <ProfileForm />
      </div>
    </AuthGuard>
  );
}
