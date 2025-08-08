"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  prefixOptions,
  countries,
  sectorsOfInterest,
  functionalAreas,
} from "@/lib/constants";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function RegisterPage() {
  const [role, setRole] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    userRole: "",
    prefix: "",
    firstName: "",
    lastName: "",
    organizationName: "",
    mobile: "",
    designation: "",
    country: "",
    sectorsOfInterest: "",
    functionalAreas: "",
  });
  const [error, setError] = useState(null);
  const { register, requestOTP, isLoading } = useAuth(); // Use requestOTP
  const router = useRouter();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (formData.password !== formData.passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!role) {
      setError("Please select a role (Buyer or Seller).");
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        userRole: role, // Use the selected role
        prefix: formData.prefix,
        firstName: formData.firstName,
        lastName: formData.lastName,
        organizationName: formData.organizationName,
        mobile: formData.mobile,
        designation: formData.designation,
        country: formData.country,
        sectorsOfInterest: formData.sectorsOfInterest,
        functionalAreas: formData.functionalAreas,
        verified: false, // Initially not verified
        profileStatus: "pending", // Initially pending admin approval
      });
      
      // After successful registration, request OTP for verification
      const otpId = await requestOTP(formData.email); // Get the otpId
      router.push(`/verify-otp?email=${formData.email}&otpId=${otpId}`); // Pass otpId to verification page
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <AuthGuard redirectIfAuthenticated="/dashboard">
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Register</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            {!role ? (
              <div className="space-y-4 text-center">
                <p className="text-lg">Are you a Buyer or a Seller?</p>
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
                    />
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
                    />
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="prefix">Prefix</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("prefix", value)}
                      value={formData.prefix}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="prefix">
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
                    />
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input
                      id="organizationName"
                      type="text"
                      value={formData.organizationName}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                      id="mobile"
                      type="text"
                      value={formData.mobile}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      type="text"
                      value={formData.designation}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("country", value)}
                      value={formData.country}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="country">
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
                  </div>
                  <div>
                    <Label htmlFor="sectorsOfInterest">Sectors of Interest</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("sectorsOfInterest", value)}
                      value={formData.sectorsOfInterest}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="sectorsOfInterest">
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
                  </div>
                  <div>
                    <Label htmlFor="functionalAreas">Functional Areas</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("functionalAreas", value)}
                      value={formData.functionalAreas}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="functionalAreas">
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
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner /> : "Register"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setRole(null)}
                  type="button"
                >
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
  );
}
