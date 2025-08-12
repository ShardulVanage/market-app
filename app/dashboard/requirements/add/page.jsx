"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import AuthGuard from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { getClientPb } from "@/lib/pocketbase"
import { productCategories, countries } from "@/lib/constants"
import { ArrowLeft, Upload } from "lucide-react"

export default function AddRequirementPage() {
  const { currentUser, isLoading } = useAuth()
  const router = useRouter()
  const pb = getClientPb()

  const [formData, setFormData] = useState({
    quoteFor: "",
    category: "",
    subcategory: "",
    subSubcategory: "",
    requirementDetails: "",
    location: "",
    attachment: null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCategoryChange = (categoryName) => {
    const category = productCategories.find((cat) => cat.name === categoryName)
    setSelectedCategory(category)
    setSelectedSubcategory(null)
    setFormData((prev) => ({
      ...prev,
      category: categoryName,
      subcategory: "",
      subSubcategory: "",
    }))
  }

  const handleSubcategoryChange = (subcategoryName) => {
    const subcategory = selectedCategory?.subcategories.find((sub) => sub.name === subcategoryName)
    setSelectedSubcategory(subcategory)
    setFormData((prev) => ({
      ...prev,
      subcategory: subcategoryName,
      subSubcategory: "",
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, attachment: file }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!currentUser?.id || currentUser.profileStatus !== "approved") {
      alert("Your profile must be approved to post requirements")
      return
    }

    setIsSubmitting(true)

    try {
      const categoryPath = [formData.category, formData.subcategory, formData.subSubcategory]
        .filter(Boolean)
        .join(" > ")

      const requirementData = {
        user: currentUser.id,
        quoteFor: formData.quoteFor,
        category: categoryPath,
        requirementDetails: formData.requirementDetails,
        location: formData.location,
        approvalStatus: "pending",
      }

      // Create FormData for file upload
      const formDataToSend = new FormData()
      Object.keys(requirementData).forEach((key) => {
        formDataToSend.append(key, requirementData[key])
      })

      if (formData.attachment) {
        formDataToSend.append("attachment", formData.attachment)
      }

      await pb.collection("requirements").create(formDataToSend)

      alert("Requirement posted successfully! It will be reviewed by admin.")
      router.push("/dashboard/requirements")
    } catch (error) {
      console.error("Failed to create requirement:", error)
      alert("Failed to post requirement. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  if (currentUser?.profileStatus !== "approved") {
    return (
      <AuthGuard redirectIfNotAuthenticated="/login">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="text-center py-8">
              <p className="text-gray-600">Your profile must be approved before you can post requirements.</p>
              <Button onClick={() => router.push("/dashboard")} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Mobile-friendly header */}
          <div className="flex flex-col sm:flex-row sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button variant="outline" onClick={() => router.push("/dashboard")} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/requirements")} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Requirements
              </Button>
            </div>
            <div className="sm:ml-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Post Requirement</h1>
              <p className="text-gray-600 text-sm sm:text-base">Create a new requirement for your business needs</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Requirement Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <Label htmlFor="quoteFor" className="text-sm font-medium">
                    Quote For *
                  </Label>
                  <Input
                    id="quoteFor"
                    value={formData.quoteFor}
                    onChange={(e) => handleInputChange("quoteFor", e.target.value)}
                    placeholder="What are you looking for?"
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category *
                    </Label>
                    <Select onValueChange={handleCategoryChange} required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {productCategories.map((category) => (
                          <SelectItem key={category.name} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCategory && (
                    <div>
                      <Label htmlFor="subcategory" className="text-sm font-medium">
                        Subcategory *
                      </Label>
                      <Select onValueChange={handleSubcategoryChange} required>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCategory.subcategories.map((subcategory) => (
                            <SelectItem key={subcategory.name} value={subcategory.name}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedSubcategory && (
                    <div>
                      <Label htmlFor="subSubcategory" className="text-sm font-medium">
                        Sub-subcategory
                      </Label>
                      <Select onValueChange={(value) => handleInputChange("subSubcategory", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select sub-subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedSubcategory.sub_subcategories.map((subSub) => (
                            <SelectItem key={subSub} value={subSub}>
                              {subSub}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="requirementDetails" className="text-sm font-medium">
                    Requirement Details *
                  </Label>
                  <Textarea
                    id="requirementDetails"
                    value={formData.requirementDetails}
                    onChange={(e) => handleInputChange("requirementDetails", e.target.value)}
                    placeholder="Describe your requirements in detail..."
                    rows={4}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="text-sm font-medium">
                    Location *
                  </Label>
                  <Select onValueChange={(value) => handleInputChange("location", value)} required>
                    <SelectTrigger className="mt-1">
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
                  <Label htmlFor="attachment" className="text-sm font-medium">
                    Attachment (Optional)
                  </Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="attachment"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("attachment").click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {formData.attachment ? formData.attachment.name : "Choose File"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 5MB)
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/requirements")}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size={16} className="mr-2" />
                        Posting...
                      </>
                    ) : (
                      "Post Requirement"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
