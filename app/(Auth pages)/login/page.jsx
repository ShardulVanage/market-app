"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import AuthGuard from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { getClientPb } from "@/lib/pocketbase"
import { Home, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [otpId, setOtpId] = useState(null)
  const [loginMethod, setLoginMethod] = useState("password")
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const { login, requestOTP, authWithOTP, isLoading } = useAuth()
  const router = useRouter()

  const handleError = (err) => {
    console.error("Login error:", err)

    // Clear previous field errors
    setFieldErrors({})

    // Try to extract detailed error message from PocketBase response
    let errorMessage = "An unexpected error occurred. Please try again."
    let hasFieldErrors = false

    // Handle PocketBase structured error responses
    if (err?.response?.data) {
      const errorData = err.response.data

      // Check if there are field-specific errors
      if (errorData.data && typeof errorData.data === "object") {
        const fieldErrs = {}
        Object.keys(errorData.data).forEach((field) => {
          if (errorData.data[field]?.message) {
            fieldErrs[field] = errorData.data[field].message
            hasFieldErrors = true
          }
        })

        if (hasFieldErrors) {
          setFieldErrors(fieldErrs)
          errorMessage = errorData.message || "Please fix the validation errors below."
        }
      } else if (errorData.message) {
        errorMessage = errorData.message
      }
    } else if (err?.data?.message) {
      errorMessage = err.data.message
    } else if (err?.message) {
      errorMessage = err.message
    } else if (typeof err === "string") {
      errorMessage = err
    }

    // Handle specific error cases for authentication
    if (errorMessage.includes("invalid login credentials") || errorMessage.includes("Failed to authenticate")) {
      errorMessage = "Invalid email or password. Please check your credentials and try again."
    } else if (errorMessage.includes("user not found")) {
      errorMessage = "No account found with this email address."
    } else if (errorMessage.includes("email not verified")) {
      errorMessage = "Please verify your email address before logging in."
    } else if (errorMessage.includes("too many requests")) {
      errorMessage = "Too many login attempts. Please wait a moment before trying again."
    }

    setError(errorMessage)
  }

  const validateForm = () => {
    const errors = {}

    if (loginMethod === "password" || loginMethod === "otp" || loginMethod === "forgot-password") {
      if (!email) {
        errors.email = "Email is required."
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Please enter a valid email address."
      }
    }

    if (loginMethod === "password" && !password) {
      errors.password = "Password is required."
    }

    if (loginMethod === "otp" && otpId && !otp) {
      errors.otp = "OTP is required."
    } else if (loginMethod === "otp" && otp && !/^\d{6}$/.test(otp)) {
      errors.otp = "OTP must be 6 digits."
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePasswordLogin = async (event) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setFieldErrors({})

    if (!validateForm()) {
      return
    }

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err) {
      handleError(err)
    }
  }

  const handleRequestOTP = async (event) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setFieldErrors({})

    if (!validateForm()) {
      return
    }

    try {
      const id = await requestOTP(email)
      setOtpId(id)
      setMessage("OTP sent to your email. Please check your inbox.")
    } catch (err) {
      handleError(err)
    }
  }

  const handleOTPLogin = async (event) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setFieldErrors({})

    if (!validateForm()) {
      return
    }

    try {
      await authWithOTP(otpId, otp)
      router.push("/dashboard")
    } catch (err) {
      handleError(err)
    }
  }

  const handleForgotPasswordRequest = async (event) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setFieldErrors({})

    if (!validateForm()) {
      return
    }

    try {
      await getClientPb().collection("users").requestPasswordReset(email)
      setMessage("Password reset link sent to your email. Please check your inbox.")
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <AuthGuard redirectIfAuthenticated="/dashboard">
      <div className="min-h-screen  flex items-center justify-center p-4 relative">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        {/* Home button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 text-[#29688A] hover:bg-[#29688A] hover:text-white transition-colors"
          onClick={() => router.push("/")}
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#29688A]">Welcome Back</h1>
            <p className="text-gray-600 mt-1">Sign in to your account</p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-[#29688A]">
                {loginMethod === "password" && "Login"}
                {loginMethod === "otp" && "Login with OTP"}
                {loginMethod === "forgot-password" && "Reset Password"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  <strong>Error:</strong> {error}
                </div>
              )}
              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  <strong>Success:</strong> {message}
                </div>
              )}

              {loginMethod === "password" && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-[#29688A] font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`border-gray-300 focus:border-[#29688A] focus:ring-[#29688A] ${
                        fieldErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      }`}
                    />
                    {fieldErrors.email && <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-[#29688A] font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`border-gray-300 focus:border-[#29688A] focus:ring-[#29688A] ${
                        fieldErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      }`}
                    />
                    {fieldErrors.password && <p className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>}
                    <Button
                      variant="link"
                      className="p-0 h-auto mt-2 text-sm text-[#29688A] hover:text-[#1e5a7a]"
                      onClick={() => {
                        setLoginMethod("forgot-password")
                        setError(null)
                        setMessage(null)
                        setFieldErrors({})
                      }}
                      type="button"
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#29688A] hover:bg-[#1e5a7a] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner /> : "Login"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-[#29688A] text-[#29688A] hover:bg-[#29688A] hover:text-white bg-transparent"
                    onClick={() => {
                      setLoginMethod("otp")
                      setOtpId(null)
                      setOtp("")
                      setError(null)
                      setMessage(null)
                      setFieldErrors({})
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
                    <Label htmlFor="email" className="text-[#29688A] font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={otpId !== null}
                      className={`border-gray-300 focus:border-[#29688A] focus:ring-[#29688A] ${
                        fieldErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      }`}
                    />
                    {fieldErrors.email && <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>}
                  </div>
                  {otpId && (
                    <div>
                      <Label htmlFor="otp" className="text-[#29688A] font-medium">
                        OTP
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                   
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className={`border-gray-300 focus:border-[#29688A] focus:ring-[#29688A] ${
                          fieldErrors.otp ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                       
                      />
                      {fieldErrors.otp && <p className="text-red-600 text-sm mt-1">{fieldErrors.otp}</p>}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-[#29688A] hover:bg-[#1e5a7a] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner /> : otpId ? "Verify OTP" : "Request OTP"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-[#29688A] text-[#29688A] hover:bg-[#29688A] hover:text-white bg-transparent"
                    onClick={() => {
                      setLoginMethod("password")
                      setOtpId(null)
                      setOtp("")
                      setError(null)
                      setMessage(null)
                      setFieldErrors({})
                    }}
                    type="button"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Password Login
                  </Button>
                </form>
              )}

              {loginMethod === "forgot-password" && (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-[#29688A] font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`border-gray-300 focus:border-[#29688A] focus:ring-[#29688A] ${
                        fieldErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      }`}
                    />
                    {fieldErrors.email && <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#29688A] hover:bg-[#1e5a7a] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner /> : "Send Reset Link"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-[#29688A] text-[#29688A] hover:bg-[#29688A] hover:text-white bg-transparent"
                    onClick={() => {
                      setLoginMethod("password")
                      setError(null)
                      setMessage(null)
                      setFieldErrors({})
                    }}
                    type="button"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center text-sm border-t pt-4">
                <span className="text-gray-600">Don&apos;t have an account? </span>
                <Button
                  variant="link"
                  className="p-0 h-auto text-[#29688A] hover:text-[#1e5a7a] font-medium"
                  onClick={() => router.push("/register")}
                >
                  Sign up here
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .bg-grid-pattern {
          background-image: radial-gradient(circle, #29688A 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </AuthGuard>
  )
}
