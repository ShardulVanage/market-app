"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "./ui/loading-spinner";

export default function AuthGuard({
  children,
  redirectIfAuthenticated,
  redirectIfNotAuthenticated,
}) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return; // Still loading, do nothing
    }

    if (redirectIfAuthenticated && currentUser) {
      router.push(redirectIfAuthenticated);
    } else if (redirectIfNotAuthenticated && !currentUser) {
      router.push(redirectIfNotAuthenticated);
    }
  }, [currentUser, isLoading, redirectIfAuthenticated, redirectIfNotAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (
    (redirectIfAuthenticated && currentUser) ||
    (redirectIfNotAuthenticated && !currentUser)
  ) {
    return null; // Redirecting, don't render children yet
  }

  return <>{children}</>;
}
