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
import { User, Building2, Phone, MapPin, Briefcase, Globe, Target, Users } from "lucide-react";

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
      const timestamp = new Date().getTime();
      await pb.collection('users').update(currentUser.id, {
        ...formData,
        profileStatus: "pending",
      }, {
        requestKey: `profile-update-${currentUser.id}-${timestamp}`,
      });
      
      await refreshAuth();
      setMessage("Profile updated successfully! Awaiting admin re-approval.");
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(`Profile update failed: ${err.message}`);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const FormSection = ({ title, icon: Icon, children }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <Icon className="h-5 w-5 text-[#29688A]" />
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  );

  const FormField = ({ label, icon: Icon, children, fullWidth = false }) => (
    <div className={fullWidth ? "col-span-full" : ""}>
      <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
        {Icon && <Icon className="h-4 w-4 text-[#29688A]" />}
        {label}
      </Label>
      {children}
    </div>
  );

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
                  onValueChange={(value) => handleSelectChange("prefix", value)}
                  value={formData.prefix}
                  disabled={isSubmitting || authLoading}
                >
                  <SelectTrigger className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20">
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
                  id="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isSubmitting || authLoading}
                  className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20"
                  placeholder="Enter your first name"
                />
              </FormField>

              <FormField label="Last Name">
                <Input
                  id="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isSubmitting || authLoading}
                  className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20"
                  placeholder="Enter your last name"
                />
              </FormField>

              <FormField label="Mobile" icon={Phone}>
                <Input
                  id="mobile"
                  type="text"
                  value={formData.mobile}
                  onChange={handleChange}
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
                  id="designation"
                  type="text"
                  value={formData.designation}
                  onChange={handleChange}
                  disabled={isSubmitting || authLoading}
                  className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20"
                  placeholder="Enter your designation"
                />
              </FormField>

              <FormField label="Organization" icon={Building2}>
                <Input
                  id="organizationName"
                  type="text"
                  value={formData.organizationName}
                  onChange={handleChange}
                  disabled={isSubmitting || authLoading}
                  className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20"
                  placeholder="Enter your organization name"
                />
              </FormField>

              <FormField label="Country" icon={MapPin}>
                <Select
                  onValueChange={(value) => handleSelectChange("country", value)}
                  value={formData.country}
                  disabled={isSubmitting || authLoading}
                >
                  <SelectTrigger className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20">
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
                  id="linkedin"
                  type="url"
                  value={formData.linkedin}
                  onChange={handleChange}
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
                  onValueChange={(value) => handleSelectChange("sectorsOfInterest", value)}
                  value={formData.sectorsOfInterest}
                  disabled={isSubmitting || authLoading}
                >
                  <SelectTrigger className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20">
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
                  onValueChange={(value) => handleSelectChange("functionalAreas", value)}
                  value={formData.functionalAreas}
                  disabled={isSubmitting || authLoading}
                >
                  <SelectTrigger className="border-gray-200 focus:border-[#29688A] focus:ring-[#29688A]/20">
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