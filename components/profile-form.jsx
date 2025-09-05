"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { User, Building2, Phone, MapPin, Briefcase, Globe, Target, Users } from "lucide-react";

export default function ProfileForm() {
  const { currentUser, pb, isLoading: authLoading, refreshAuth } = useAuth();
  const router = useRouter();
  const isInitialized = useRef(false);

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

  // Initialize form data only once when currentUser is available
  useEffect(() => {
    if (currentUser && !isInitialized.current) {
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
      isInitialized.current = true;
    }
  }, [currentUser]);

  // Stable event handlers that won't cause re-renders
  const handleFieldChange = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  // Memoized handlers to prevent re-creation
  const inputHandlers = useMemo(() => ({
    prefix: (value) => handleFieldChange('prefix', value),
    firstName: (e) => handleFieldChange('firstName', e.target.value),
    lastName: (e) => handleFieldChange('lastName', e.target.value),
    organizationName: (e) => handleFieldChange('organizationName', e.target.value),
    mobile: (e) => handleFieldChange('mobile', e.target.value),
    designation: (e) => handleFieldChange('designation', e.target.value),
    country: (value) => handleFieldChange('country', value),
    sectorsOfInterest: (value) => handleFieldChange('sectorsOfInterest', value),
    functionalAreas: (value) => handleFieldChange('functionalAreas', value),
    linkedin: (e) => handleFieldChange('linkedin', e.target.value),
  }), [handleFieldChange]);

  const handleSubmit = useCallback(async (event) => {
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
      const timestamp = new Date().getTime();
      await pb.collection('users').update(currentUser.id, {
        ...formData,
        profileStatus: "pending",
      }, {
        requestKey: `profile-update-${currentUser.id}-${timestamp}`,
      });
      
      // Send email notification to admin
      try {
        const response = await fetch('/api/send-profile-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userDetails: {
              ...formData,
              email: currentUser.email,
            }
          }),
        });

        if (!response.ok) {
          console.error('Failed to send admin notification');
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }
      
      await refreshAuth();
      setMessage("Profile updated successfully! Awaiting admin re-approval.");
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(`Profile update failed: ${err.message}`);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, formData, pb, refreshAuth]);

  // Memoized components to prevent unnecessary re-renders
  const FormSection = useCallback(({ title, icon: Icon, children }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <Icon className="h-5 w-5 text-[#29688A]" />
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  ), []);

  const FormField = useCallback(({ label, icon: Icon, children, fullWidth = false }) => (
    <div className={fullWidth ? "col-span-full" : ""}>
      <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
        {Icon && <Icon className="h-4 w-4 text-[#29688A]" />}
        {label}
      </Label>
      {children}
    </div>
  ), []);

  // Don't render until we have the user data and form is initialized
  if (!currentUser || !isInitialized.current) {
    return (
      <div className="w-full max-w-4xl mx-auto flex justify-center items-center min-h-[400px]">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#29688A] rounded-full mb-4">
          <User className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Edit Profile</h1>
        <p className="text-gray-600">Update your information to keep your profile current</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg">
          <p className="text-green-700 text-sm font-medium">{message}</p>
        </div>
      )}

      {/* Form Card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <FormSection title="Personal Information" icon={User}>
              <FormField label="Prefix">
                <Select
                  onValueChange={inputHandlers.prefix}
                  value={formData.prefix}
                  disabled={isSubmitting || authLoading}
                >
                  <SelectTrigger className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20 w-full">
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
              </FormField>

              <FormField label="First Name">
                <Input
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={inputHandlers.firstName}
                  disabled={isSubmitting || authLoading}
                  className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20"
                  placeholder="Enter your first name"
                />
              </FormField>

              <FormField label="Last Name">
                <Input
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={inputHandlers.lastName}
                  disabled={isSubmitting || authLoading}
                  className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20"
                  placeholder="Enter your last name"
                />
              </FormField>

              <FormField label="Mobile" icon={Phone}>
                <Input
                  name="mobile"
                  type="text"
                  value={formData.mobile}
                  onChange={inputHandlers.mobile}
                  disabled={isSubmitting || authLoading}
                  className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20"
                  placeholder="Enter your mobile number"
                />
              </FormField>
            </FormSection>

            {/* Professional Information */}
            <FormSection title="Professional Information" icon={Briefcase}>
              <FormField label="Designation" icon={Briefcase}>
                <Input
                  name="designation"
                  type="text"
                  value={formData.designation}
                  onChange={inputHandlers.designation}
                  disabled={isSubmitting || authLoading}
                  className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20"
                  placeholder="Enter your designation"
                />
              </FormField>

              <FormField label="Organization" icon={Building2}>
                <Input
                  name="organizationName"
                  type="text"
                  value={formData.organizationName}
                  onChange={inputHandlers.organizationName}
                  disabled={isSubmitting || authLoading}
                  className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20"
                  placeholder="Enter your organization name"
                />
              </FormField>

              <FormField label="Country" icon={MapPin}>
                <Select
                  onValueChange={inputHandlers.country}
                  value={formData.country}
                  disabled={isSubmitting || authLoading}
                >
                  <SelectTrigger className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20 w-full">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="LinkedIn Profile" icon={Globe}>
                <Input
                  name="linkedin"
                  type="url"
                  value={formData.linkedin}
                  onChange={inputHandlers.linkedin}
                  placeholder="https://linkedin.com/in/yourprofile"
                  disabled={isSubmitting || authLoading}
                  className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20"
                />
              </FormField>
            </FormSection>

            {/* Areas of Interest */}
            <FormSection title="Areas of Interest" icon={Target}>
              <FormField label="Sectors of Interest" icon={Target} fullWidth>
                <Select
                  onValueChange={inputHandlers.sectorsOfInterest}
                  value={formData.sectorsOfInterest}
                  disabled={isSubmitting || authLoading}
                >
                  <SelectTrigger className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20 w-full">
                    <SelectValue placeholder="Select sectors of interest" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectorsOfInterest.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Functional Areas" icon={Users} fullWidth>
                <Select
                  onValueChange={inputHandlers.functionalAreas}
                  value={formData.functionalAreas}
                  disabled={isSubmitting || authLoading}
                >
                  <SelectTrigger className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20 w-full">
                    <SelectValue placeholder="Select functional areas" />
                  </SelectTrigger>
                  <SelectContent>
                    {functionalAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </FormSection>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                disabled={isSubmitting}
                className="border-gray-200 text-gray-700 hover:bg-gray-50 px-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || authLoading}
                className="bg-[#29688A] hover:bg-[#1f4f6b] text-white px-8 min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}