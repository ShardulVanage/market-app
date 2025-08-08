"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function VerifyOtpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, requestOTP, authWithOTP, isLoading } = useAuth();

  const initialEmail = searchParams.get("email") || currentUser?.email || "";
  const initialOtpId = searchParams.get("otpId") || null;
  
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [otpId, setOtpId] = useState(initialOtpId);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Automatically request OTP if email is present and no otpId is available
  useEffect(() => {
    const sendOtp = async () => {
      // Only request if email is present, no otpId, not loading, and user is not verified
      // Note: currentUser will be null right after registration, which is expected here.
      if (email && !otpId && !isLoading && !currentUser?.verified) {
        setError(null);
        setMessage(null);
        try {
          const id = await requestOTP(email);
          setOtpId(id);
          setMessage("OTP sent to your email. Please check your inbox.");
        } catch (err) {
          setError(err.message || "Failed to send OTP. Please try again.");
        }
      }
    };
    sendOtp();
  }, [email, otpId, isLoading, currentUser?.verified, requestOTP]);

  // Redirect if already verified
  useEffect(() => {
    if (!isLoading && currentUser?.verified) {
      router.push("/dashboard");
    }
  }, [currentUser?.verified, isLoading, router]);

  const handleResendOTP = useCallback(async () => {
    setError(null);
    setMessage(null);
    try {
      const id = await requestOTP(email);
      setOtpId(id);
      setMessage("New OTP sent. Please check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    }
  }, [email, requestOTP]);

  const handleVerifyOTP = useCallback(async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!email || !otp || !otpId) {
      setError("Please enter email, OTP, and ensure OTP was requested.");
      return;
    }
    try {
      await authWithOTP(otpId, otp);
      setMessage("Email verified successfully!");
      // The useEffect will handle the redirect to dashboard after currentUser is updated
    } catch (err) {
      setError(err.message || "OTP verification failed. Please try again.");
    }
  }, [email, otp, otpId, authWithOTP]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // AuthGuard should only redirect if the user is ALREADY authenticated AND verified.
  // If they are not authenticated (just registered) or authenticated but not verified,
  // they should remain on this page to complete verification.
  return (
    <AuthGuard redirectIfAuthenticated="/dashboard"> {/* Corrected: Only redirect if already authenticated AND verified */}
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            {message && <p className="text-green-500 text-center mb-4">{message}</p>}

            <p className="text-center mb-4">
              An OTP has been sent to <strong>{email}</strong>. Please enter it below to verify your email address.
            </p>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpId !== null || isLoading} // Disable email input if otpId exists or loading
                />
              </div>
              <div>
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter OTP"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <LoadingSpinner /> : "Verify Email"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendOTP}
                disabled={isLoading}
                type="button"
              >
                Resend OTP
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
