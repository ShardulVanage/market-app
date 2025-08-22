"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import AuthGuard from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { prefixOptions, countries, sectorsOfInterest, functionalAreas } from "@/lib/constants"
import LoadingSpinner from "@/components/ui/loading-spinner"

export default function RegisterPage() {
  const [role, setRole] = useState(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    userRole: "",
    prefix: "",
    firstName: "",
    lastName: "",
    organizationName: "",
    designation: "",
    country: "",
    sectorsOfInterest: "",
    functionalAreas: "",
  })
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState("")
  const { register, requestOTP, isLoading } = useAuth()
  const router = useRouter()

  const handleError = (err) => {
    console.log("[v0] Registration error:", err)

    setErrors({})
    setGeneralError("")

    // PocketBase SDK errors don't have err.response, they have direct properties
    if (err && typeof err === "object") {
      // Check if it's a PocketBase validation error with data property
      if (err.data && typeof err.data === "object") {
        console.log("Found err.data:", err.data)

        const fieldErrors = {}

        Object.keys(err.data).forEach((field) => {
          const errorMessage = err.data[field]

          if (field === "email" && typeof errorMessage === "object" && errorMessage.message) {
            // Handle { email: { message: "Value must be unique" } }
            if (errorMessage.message.toLowerCase().includes("unique")) {
              fieldErrors[field] = "Email already exists. Please use a different email address."
            } else {
              fieldErrors[field] = errorMessage.message
            }
          } else if (field === "email" && typeof errorMessage === "string") {
            // Handle { email: "Value must be unique" }
            if (errorMessage.toLowerCase().includes("unique")) {
              fieldErrors[field] = "Email already exists. Please use a different email address."
            } else {
              fieldErrors[field] = errorMessage
            }
          } else if (typeof errorMessage === "string") {
            fieldErrors[field] = errorMessage
          } else if (typeof errorMessage === "object" && errorMessage.message) {
            fieldErrors[field] = errorMessage.message
          }
        })

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)

          if (fieldErrors.email) {
            setGeneralError("Email already exists. Please use a different email address.")
          } else {
            setGeneralError("Please fix the errors below:")
          }
          return
        }
      }

      // Check for direct error message about email uniqueness
      if (err.message && typeof err.message === "string") {
        if (err.message.toLowerCase().includes("unique") && err.message.toLowerCase().includes("email")) {
          setErrors({ email: "Email already exists. Please use a different email address." })
          setGeneralError("Email already exists. Please use a different email address.")
          return
        }

        // Check for "Failed to create record" - often indicates unique constraint
        if (err.message === "Failed to create record.") {
          // This is likely a unique email constraint error
          setErrors({ email: "Email already exists. Please use a different email address." })
          setGeneralError("Email already exists. Please use a different email address.")
          return
        }
      }

      // Check for PocketBase error with isAbort property (common structure)
      if (err.isAbort !== undefined) {
        setGeneralError("Request was cancelled. Please try again.")
        return
      }
    }

    // Fallback error handling
    if (err?.message) {
      if (err.message.includes("Failed to fetch")) {
        setGeneralError("Network error. Please check your connection and try again.")
      } else if (err.message.includes("400")) {
        setGeneralError("Invalid registration data. Please check all fields.")
      } else if (err.message.includes("409")) {
        setGeneralError("Email already exists. Please use a different email address.")
      } else {
        setGeneralError(err.message)
      }
    } else {
      setGeneralError("Registration failed. Please try again.")
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long"
    }

    // Password confirmation validation
    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = "Password confirmation is required"
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = "Passwords do not match"
    }

    // Required field validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }

    // Role validation
    if (!role) {
      newErrors.userRole = "Please select a role (Buyer or Seller)"
    }

    return newErrors
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))

    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }))
    }
  }

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }))

    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setErrors({})
    setGeneralError("")

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setGeneralError("Please fix the errors below:")
      return
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        userRole: role,
        prefix: formData.prefix,
        firstName: formData.firstName,
        lastName: formData.lastName,
        organizationName: formData.organizationName,
        designation: formData.designation,
        country: formData.country,
        sectorsOfInterest: formData.sectorsOfInterest,
        functionalAreas: formData.functionalAreas,
        verified: false,
        profileStatus: "pending",
      })

      try {
        await fetch("/api/send-registration-emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userEmail: formData.email,
            userName: `${formData.prefix} ${formData.firstName} ${formData.lastName}`.trim(),
            userRole: role,
            organizationName: formData.organizationName,
          }),
        })
      } catch (emailError) {
        console.error("Failed to send registration emails:", emailError)
        // Don't block the registration flow if email fails
      }

      const otpId = await requestOTP(formData.email)
      router.push(`/verify-otp?email=${formData.email}&otpId=${otpId}`)
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <AuthGuard redirectIfAuthenticated="/dashboard">
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Register</CardTitle>
          </CardHeader>
          <CardContent>
            {generalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-medium">{generalError}</p>
                {Object.keys(errors).length > 0 && (
                  <ul className="mt-2 text-sm list-disc list-inside">
                    {Object.entries(errors).map(
                      ([field, error]) =>
                        error && (
                          <li key={field}>
                            <strong>{field}:</strong> {error}
                          </li>
                        ),
                    )}
                  </ul>
                )}
              </div>
            )}

            {!role ? (
              <div className="space-y-4 text-center">
                <p className="text-lg">Are you a Buyer or a Seller?</p>
                {errors.userRole && <p className="text-red-500 text-sm">{errors.userRole}</p>}
                <div className="flex justify-center gap-4">
                  <Button onClick={() => setRole("buyer")} className="w-32" disabled={isLoading}>
                    Buyer
                  </Button>
                  <Button onClick={() => setRole("seller")} className="w-32" disabled={isLoading}>
                    Seller
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={errors.email ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={errors.password ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <Label htmlFor="passwordConfirm">Confirm Password</Label>
                    <Input
                      id="passwordConfirm"
                      type="password"
                      required
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={errors.passwordConfirm ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {errors.passwordConfirm && <p className="text-red-500 text-sm mt-1">{errors.passwordConfirm}</p>}
                  </div>
                  <div>
                    <Label htmlFor="prefix">Prefix</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("prefix", value)}
                      value={formData.prefix}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="prefix" className={errors.prefix ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select prefix" />
                      </SelectTrigger>
                      <SelectContent>
                        {prefixOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.prefix && <p className="text-red-500 text-sm mt-1">{errors.prefix}</p>}
                  </div>
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={errors.firstName ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={errors.lastName ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input
                      id="organizationName"
                      type="text"
                      value={formData.organizationName}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={errors.organizationName ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {errors.organizationName && <p className="text-red-500 text-sm mt-1">{errors.organizationName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      type="text"
                      value={formData.designation}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={errors.designation ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {errors.designation && <p className="text-red-500 text-sm mt-1">{errors.designation}</p>}
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("country", value)}
                      value={formData.country}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="country" className={errors.country ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                  </div>
                  <div>
                    <Label htmlFor="sectorsOfInterest">Sectors of Interest</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("sectorsOfInterest", value)}
                      value={formData.sectorsOfInterest}
                      disabled={isLoading}
                    >
                      <SelectTrigger
                        id="sectorsOfInterest"
                        className={errors.sectorsOfInterest ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectorsOfInterest.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.sectorsOfInterest && (
                      <p className="text-red-500 text-sm mt-1">{errors.sectorsOfInterest}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="functionalAreas">Functional Areas</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("functionalAreas", value)}
                      value={formData.functionalAreas}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="functionalAreas" className={errors.functionalAreas ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select functional area" />
                      </SelectTrigger>
                      <SelectContent>
                        {functionalAreas.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.functionalAreas && <p className="text-red-500 text-sm mt-1">{errors.functionalAreas}</p>}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner /> : "Register"}
                </Button>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => setRole(null)} type="button">
                  Back to Role Selection
                </Button>
              </form>
            )}

            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/login")}>
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
