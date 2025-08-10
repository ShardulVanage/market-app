"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { getClientPb } from "@/lib/pocketbase";
import { measurementUnits, productCategories } from "@/lib/constants";
import { Upload, X, Plus, Minus, ArrowLeft } from 'lucide-react';

export default function AddProductPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const pb = getClientPb();

  const [companyData, setCompanyData] = useState(null);
  const [isFetchingCompany, setIsFetchingCompany] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category selection states
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedSubSubcategory, setSelectedSubSubcategory] = useState("");
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [availableSubSubcategories, setAvailableSubSubcategories] = useState([]);

  // Form data state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    hsc: "",
    keywords: "",
    price: "",
    measurement: "",
    contact: "",
    images: [],
    productDetails: {
      description: "",
      exportCountries: [],
      relatedSectors: [],
      certification: "",
      majorBuyers: "",
      availability: ""
    },
    specifications: {
      brand: "",
      modalNumber: "",
      material: "",
      finishing: "",
      packageType: "",
      usageApplication: "",
      warranty: ""
    }
  });

  // Temporary states for adding array items
  const [newExportCountry, setNewExportCountry] = useState("");
  const [newRelatedSector, setNewRelatedSector] = useState("");

  // Fetch company details
  const fetchCompanyDetails = useCallback(async (signal) => {
    if (!currentUser?.id || !pb.authStore.isValid) {
      setCompanyData(null);
      setIsFetchingCompany(false);
      return;
    }

    if (currentUser.userRole !== "seller") {
      setCompanyData(null);
      setIsFetchingCompany(false);
      return;
    }

    setIsFetchingCompany(true);
    
    try {
      const record = await pb.collection("companies").getFirstListItem(
        `user="${currentUser.id}"`,
        { signal }
      );
      setCompanyData(record);
    } catch (err) {
      // Handle auto-cancellation gracefully
      if (err.name === 'AbortError' || err.message?.includes('autocancelled')) {
        console.log("Request was cancelled, this is normal when navigating quickly");
        return;
      }
      
      if (err.status === 404) {
        setCompanyData(null);
      } else {
        console.error("Failed to fetch company details:", err);
      }
    } finally {
      setIsFetchingCompany(false);
    }
  }, [currentUser, pb]);

  useEffect(() => {
    if (!currentUser?.id) {
      setIsFetchingCompany(false);
      return;
    }

    const controller = new AbortController();
    
    // Small delay to avoid rapid successive requests
    const timeout = setTimeout(() => {
      fetchCompanyDetails(controller.signal);
    }, 100);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [currentUser?.id, fetchCompanyDetails]);

  // Handle category selection
  const handleCategoryChange = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedSubcategory("");
    setSelectedSubSubcategory("");
    
    const category = productCategories.find(cat => cat.name === categoryName);
    setAvailableSubcategories(category ? category.subcategories : []);
    setAvailableSubSubcategories([]);
  };

  const handleSubcategoryChange = (subcategoryName) => {
    setSelectedSubcategory(subcategoryName);
    setSelectedSubSubcategory("");
    
    const category = productCategories.find(cat => cat.name === selectedCategory);
    const subcategory = category?.subcategories.find(sub => sub.name === subcategoryName);
    setAvailableSubSubcategories(subcategory ? subcategory.sub_subcategories : []);
  };

  const handleSubSubcategoryChange = (subSubcategoryName) => {
    setSelectedSubSubcategory(subSubcategoryName);
  };

  // Get final category string
  const getFinalCategoryString = () => {
    if (selectedCategory && selectedSubcategory && selectedSubSubcategory) {
      return `${selectedCategory},${selectedSubcategory},${selectedSubSubcategory}`;
    }
    return "";
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle nested object changes (productDetails, specifications)
  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle array operations for productDetails
  const addToArray = (section, field, value) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: [...prev[section][field], value.trim()]
        }
      }));
    }
  };

  const removeFromArray = (section, field, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index)
      }
    }));
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!companyData || companyData.approvalStatus !== "approved") {
      alert("You need an approved company profile to list products.");
      return;
    }

    const categoryString = getFinalCategoryString();
    if (!categoryString) {
      alert("Please select a complete category path.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSubmit = new FormData();
      
      // Add basic fields
      formDataToSubmit.append("title", formData.title);
      formDataToSubmit.append("description", formData.description);
      formDataToSubmit.append("hsc", formData.hsc);
      formDataToSubmit.append("keywords", formData.keywords);
      formDataToSubmit.append("category", categoryString);
      formDataToSubmit.append("price", parseFloat(formData.price) || 0);
      formDataToSubmit.append("measurement", formData.measurement);
      formDataToSubmit.append("contact", formData.contact);
      formDataToSubmit.append("company", companyData.id);
      formDataToSubmit.append("seller", currentUser.id);
      formDataToSubmit.append("approvalStatus", "pending");

      // Add images
      formData.images.forEach((image, index) => {
        formDataToSubmit.append("images", image);
      });

      // Add JSON fields
      formDataToSubmit.append("productDetails", JSON.stringify(formData.productDetails));
      formDataToSubmit.append("specifications", JSON.stringify(formData.specifications));

      await pb.collection("products").create(formDataToSubmit);
      
      alert("Product submitted successfully! It will be reviewed by admin.");
      router.push("/dashboard/products");
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isFetchingCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!currentUser || currentUser.userRole !== "seller") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-red-600">Access denied. Sellers only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center mb-4">You need to add company details before listing products.</p>
            <Button onClick={() => router.push("/dashboard/company")} className="w-full">
              Add Company Details
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (companyData.approvalStatus !== "approved") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center mb-4">
              Your company profile is {companyData.approvalStatus}. 
              You can only list products after admin approval.
            </p>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-4 mb-4">
              <Button 
                onClick={() => router.push("/dashboard/products")}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
            </div>
            <CardTitle className="text-2xl">Add New Product</CardTitle>
            <p className="text-gray-600">Fill in the details to list your product</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div>
                  <Label htmlFor="title">Product Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hsc">HSC Code</Label>
                    <Input
                      id="hsc"
                      value={formData.hsc}
                      onChange={(e) => handleInputChange("hsc", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="keywords">Keywords</Label>
                    <Input
                      id="keywords"
                      value={formData.keywords}
                      onChange={(e) => handleInputChange("keywords", e.target.value)}
                      placeholder="Comma separated keywords"
                    />
                  </div>
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Category Selection *</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                      <SelectTrigger>
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

                  <div>
                    <Label>Subcategory</Label>
                    <Select 
                      value={selectedSubcategory} 
                      onValueChange={handleSubcategoryChange}
                      disabled={!selectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubcategories.map((subcategory) => (
                          <SelectItem key={subcategory.name} value={subcategory.name}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Sub-subcategory</Label>
                    <Select 
                      value={selectedSubSubcategory} 
                      onValueChange={handleSubSubcategoryChange}
                      disabled={!selectedSubcategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub-subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubSubcategories.map((subSubcategory) => (
                          <SelectItem key={subSubcategory} value={subSubcategory}>
                            {subSubcategory}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {getFinalCategoryString() && (
                  <div className="p-3 bg-gray-100 rounded">
                    <p className="text-sm text-gray-600">Selected Category Path:</p>
                    <p className="font-medium">{getFinalCategoryString()}</p>
                  </div>
                )}
              </div>

              {/* Pricing & Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing & Contact</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="measurement">Measurement Unit *</Label>
                    <Select value={formData.measurement} onValueChange={(value) => handleInputChange("measurement", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {measurementUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contact">Contact Number *</Label>
                    <Input
                      id="contact"
                      value={formData.contact}
                      onChange={(e) => handleInputChange("contact", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Product Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Product Images</h3>
                
                <div>
                  <Label htmlFor="images">Upload Images</Label>
                  <div className="mt-2">
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("images").click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Images
                    </Button>
                  </div>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image) || "/placeholder.svg"}
                          alt={`Product ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Product Details</h3>
                
                <div>
                  <Label htmlFor="productDescription">Detailed Description</Label>
                  <Textarea
                    id="productDescription"
                    value={formData.productDetails.description}
                    onChange={(e) => handleNestedChange("productDetails", "description", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="certification">Certification</Label>
                    <Input
                      id="certification"
                      value={formData.productDetails.certification}
                      onChange={(e) => handleNestedChange("productDetails", "certification", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="availability">Availability</Label>
                    <Input
                      id="availability"
                      value={formData.productDetails.availability}
                      onChange={(e) => handleNestedChange("productDetails", "availability", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="majorBuyers">Major Buyers</Label>
                  <Input
                    id="majorBuyers"
                    value={formData.productDetails.majorBuyers}
                    onChange={(e) => handleNestedChange("productDetails", "majorBuyers", e.target.value)}
                  />
                </div>

                {/* Export Countries */}
                <div>
                  <Label>Export Countries</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newExportCountry}
                      onChange={(e) => setNewExportCountry(e.target.value)}
                      placeholder="Add export country"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        addToArray("productDetails", "exportCountries", newExportCountry);
                        setNewExportCountry("");
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.productDetails.exportCountries.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.productDetails.exportCountries.map((country, index) => (
                        <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                          <span className="text-sm">{country}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-4 h-4 p-0"
                            onClick={() => removeFromArray("productDetails", "exportCountries", index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Related Sectors */}
                <div>
                  <Label>Related Sectors</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newRelatedSector}
                      onChange={(e) => setNewRelatedSector(e.target.value)}
                      placeholder="Add related sector"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        addToArray("productDetails", "relatedSectors", newRelatedSector);
                        setNewRelatedSector("");
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.productDetails.relatedSectors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.productDetails.relatedSectors.map((sector, index) => (
                        <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                          <span className="text-sm">{sector}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-4 h-4 p-0"
                            onClick={() => removeFromArray("productDetails", "relatedSectors", index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Specifications</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.specifications.brand}
                      onChange={(e) => handleNestedChange("specifications", "brand", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="modalNumber">Model Number</Label>
                    <Input
                      id="modalNumber"
                      value={formData.specifications.modalNumber}
                      onChange={(e) => handleNestedChange("specifications", "modalNumber", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={formData.specifications.material}
                      onChange={(e) => handleNestedChange("specifications", "material", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="finishing">Finishing</Label>
                    <Input
                      id="finishing"
                      value={formData.specifications.finishing}
                      onChange={(e) => handleNestedChange("specifications", "finishing", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="packageType">Package Type</Label>
                    <Input
                      id="packageType"
                      value={formData.specifications.packageType}
                      onChange={(e) => handleNestedChange("specifications", "packageType", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="warranty">Warranty</Label>
                    <Input
                      id="warranty"
                      value={formData.specifications.warranty}
                      onChange={(e) => handleNestedChange("specifications", "warranty", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="usageApplication">Usage/Application</Label>
                  <Textarea
                    id="usageApplication"
                    value={formData.specifications.usageApplication}
                    onChange={(e) => handleNestedChange("specifications", "usageApplication", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size={16} className="mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Product for Approval"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
