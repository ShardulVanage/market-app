"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { getClientPb } from "@/lib/pocketbase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpId, setOtpId] = useState(null); // Initialize as null
  const [loginMethod, setLoginMethod] = useState(
    "password"
  );
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const { login, requestOTP, authWithOTP, isLoading } = useAuth();
  const router = useRouter();

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    }
  };

  const handleRequestOTP = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    try {
      const id = await requestOTP(email); // Get the otpId
      setOtpId(id); // Store the otpId
      setMessage("OTP sent to your email. Please check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to request OTP. Please try again.");
    }
  };

  const handleOTPLogin = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!email || !otp || !otpId) { // Ensure otpId is present
      setError("Please enter email, OTP, and ensure OTP was requested.");
      return;
    }
    try {
      await authWithOTP(otpId, otp); // Pass otpId and otp
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "OTP verification failed. Please try again.");
    }
  };

  const handleForgotPasswordRequest = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    try {
      await getClientPb().collection('users').requestPasswordReset(email);
      setMessage("Password reset link sent to your email. Please check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to request password reset. Please try again.");
    }
  };

  return (
    <AuthGuard redirectIfAuthenticated="/dashboard">
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            {message && <p className="text-green-500 text-center mb-4">{message}</p>}

            {loginMethod === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    variant="link"
                    className="p-0 h-auto mt-2 text-sm"
                    onClick={() => {
                      setLoginMethod("forgot-password");
                      setError(null);
                      setMessage(null);
                    }}
                    type="button"
                  >
                    Forgot password?
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner /> : "Login"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setLoginMethod("otp");
                    setOtpId(null); // Reset otpId
                    setOtp(""); // Clear OTP field
                    setError(null);
                    setMessage(null);
                  }}
                  type="button"
                >
                  Login with OTP
                </Button>
              </form>
            )}

            {loginMethod === "otp" && (
              <form onSubmit={otpId ? handleOTPLogin : handleRequestOTP} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={otpId !== null} 
                  />
                </div>
                {otpId && (
                  <div>
                    <Label htmlFor="otp">OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter OTP"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : otpId ? (
                    "Verify OTP"
                  ) : (
                    "Request OTP"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setLoginMethod("password");
                    setOtpId(null);
                    setOtp("");
                    setError(null);
                    setMessage(null);
                  }}
                  type="button"
                >
                  Back to Password Login
                </Button>
              </form>
            )}

            {loginMethod === "forgot-password" && (
              <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner /> : "Request Password Reset"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setLoginMethod("password");
                    setError(null);
                    setMessage(null);
                  }}
                  type="button"
                >
                  Back to Login
                </Button>
              </form>
            )}

            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/register")}>
                Sign up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
