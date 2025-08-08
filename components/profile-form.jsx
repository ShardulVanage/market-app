"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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

export default function ProfileForm() {
  const { currentUser, pb, isLoading: authLoading, refreshAuth } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    prefix: "",
    firstName: "",
    lastName: "",
    organizationName: "",
    mobile: "",
    designation: "",
    country: "",
    sectorsOfInterest: "",
    functionalAreas: "",
    linkedin: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        prefix: currentUser.prefix || "",
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        organizationName: currentUser.organizationName || "",
        mobile: currentUser.mobile || "",
        designation: currentUser.designation || "",
        country: currentUser.country || "",
        sectorsOfInterest: currentUser.sectorsOfInterest || "",
        functionalAreas: currentUser.functionalAreas || "",
        linkedin: currentUser.linkedin || "",
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);
    setIsError(false);

    if (!currentUser?.id) {
      setError("User not authenticated.");
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    try {
      // Use a timestamp to make each request key unique
      const timestamp = new Date().getTime();
      // Update user profile and set profileStatus to pending for re-approval
      await pb.collection('users').update(currentUser.id, {
        ...formData,
        profileStatus: "pending",
      }, {
        requestKey: `profile-update-${currentUser.id}-${timestamp}`,
      });
      
      await refreshAuth(); // Refresh auth to get updated currentUser
      setMessage("Profile updated successfully! Awaiting admin re-approval.");
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(`Profile update failed: ${err.message}`);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {message && <p className="text-green-500 text-center mb-4">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prefix">Prefix</Label>
              <Select
                onValueChange={(value) => handleSelectChange("prefix", value)}
                value={formData.prefix}
                disabled={isSubmitting || authLoading}
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
                disabled={isSubmitting || authLoading}
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
                disabled={isSubmitting || authLoading}
              />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                type="text"
                value={formData.mobile}
                onChange={handleChange}
                disabled={isSubmitting || authLoading}
              />
            </div>
            <div>
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                type="text"
                value={formData.designation}
                onChange={handleChange}
                disabled={isSubmitting || authLoading}
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select
                onValueChange={(value) => handleSelectChange("country", value)}
                value={formData.country}
                disabled={isSubmitting || authLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                type="text"
                value={formData.organizationName}
                onChange={handleChange}
                disabled={isSubmitting || authLoading}
              />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
              <Input
                id="linkedin"
                type="url"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/yourprofile"
                disabled={isSubmitting || authLoading}
              />
            </div>
            <div className="col-span-full">
              <Label htmlFor="sectorsOfInterest">Sectors of Interest</Label>
              <Select
                onValueChange={(value) => handleSelectChange("sectorsOfInterest", value)}
                value={formData.sectorsOfInterest}
                disabled={isSubmitting || authLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sectors" />
                </SelectTrigger>
                <SelectContent>
                  {sectorsOfInterest.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-full">
              <Label htmlFor="functionalAreas">Functional Areas</Label>
              <Select
                onValueChange={(value) => handleSelectChange("functionalAreas", value)}
                value={formData.functionalAreas}
                disabled={isSubmitting || authLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select functional area" />
                </SelectTrigger>
                <SelectContent>
                  {functionalAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || authLoading}
              className="min-w-[120px]"
            >
              {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
              {isSubmitting ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
