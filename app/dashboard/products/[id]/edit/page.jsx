"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
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
import { measurementUnits, productCategories } from "@/lib/constants"
import { Upload, X, Plus, ArrowLeft } from "lucide-react"

export default function EditProductPage() {
  const { currentUser, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const pb = getClientPb()

  const [product, setProduct] = useState(null)
  const [isFetchingProduct, setIsFetchingProduct] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)

  // Category selection states
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [selectedSubSubcategory, setSelectedSubSubcategory] = useState("")
  const [availableSubcategories, setAvailableSubcategories] = useState([])
  const [availableSubSubcategories, setAvailableSubSubcategories] = useState([])

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
    newImages: [],
    productDetails: {
      description: "",
      exportCountries: [],
      relatedSectors: [],
      certification: "",
      majorBuyers: "",
      availability: "",
    },
    specifications: {
      brand: "",
      modalNumber: "",
      material: "",
      finishing: "",
      packageType: "",
      usageApplication: "",
      warranty: "",
    },
  })

  // Temporary states for adding array items
  const [newExportCountry, setNewExportCountry] = useState("")
  const [newRelatedSector, setNewRelatedSector] = useState("")

  const compressImage = (file, maxSizeMB = 4, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 1920
        const maxHeight = 1920
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          "image/jpeg",
          quality,
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // Fetch product details
  const fetchProduct = useCallback(
    async (signal) => {
      if (!currentUser?.id || !pb.authStore.isValid || !params.id) {
        setIsFetchingProduct(false)
        return
      }

      setIsFetchingProduct(true)

      try {
        const productRecord = await pb.collection("products").getOne(params.id, {
          expand: "company,seller",
          signal,
        })

        // Check if current user owns this product
        if (productRecord.seller !== currentUser.id) {
          alert("You don't have permission to edit this product.")
          router.push("/dashboard/products")
          return
        }

        setProduct(productRecord)

        setSelectedCategory(productRecord.category || "")
        setSelectedSubcategory(productRecord.sub_category || "")
        setSelectedSubSubcategory(productRecord.sub_sub_category || "")

        // Set form data
        setFormData({
          title: productRecord.title || "",
          description: productRecord.description || "",
          hsc: productRecord.hsc || "",
          keywords: productRecord.keywords || "",
          price: productRecord.price?.toString() || "",
          measurement: productRecord.measurement || "",
          contact: productRecord.contact || "",
          images: productRecord.images || [],
          newImages: [],
          productDetails: productRecord.productDetails || {
            description: "",
            exportCountries: [],
            relatedSectors: [],
            certification: "",
            majorBuyers: "",
            availability: "",
          },
          specifications: productRecord.specifications || {
            brand: "",
            modalNumber: "",
            material: "",
            finishing: "",
            packageType: "",
            usageApplication: "",
            warranty: "",
          },
        })

        if (productRecord.category) {
          const category = productCategories.find((cat) => cat.name === productRecord.category)
          if (category) {
            setAvailableSubcategories(category.subcategories)

            if (productRecord.sub_category) {
              const subcategory = category.subcategories.find((sub) => sub.name === productRecord.sub_category)
              if (subcategory) {
                setAvailableSubSubcategories(subcategory.sub_subcategories)
              }
            }
          }
        }
      } catch (err) {
        // Handle auto-cancellation gracefully
        if (err.name === "AbortError" || err.message?.includes("autocancelled")) {
          console.log("Request was cancelled, this is normal when navigating quickly")
          return
        }

        console.error("Failed to fetch product:", err)
        alert("Failed to load product details.")
        router.push("/dashboard/products")
      } finally {
        setIsFetchingProduct(false)
      }
    },
    [currentUser, pb, params.id, router],
  )

  useEffect(() => {
    if (!currentUser?.id || !params.id) return

    const controller = new AbortController()

    const timeout = setTimeout(() => {
      fetchProduct(controller.signal)
    }, 100)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [currentUser?.id, params.id, fetchProduct])

  // Handle category selection
  const handleCategoryChange = (categoryName) => {
    setSelectedCategory(categoryName)
    setSelectedSubcategory("")
    setSelectedSubSubcategory("")

    const category = productCategories.find((cat) => cat.name === categoryName)
    setAvailableSubcategories(category ? category.subcategories : [])
    setAvailableSubSubcategories([])
  }

  const handleSubcategoryChange = (subcategoryName) => {
    setSelectedSubcategory(subcategoryName)
    setSelectedSubSubcategory("")

    const category = productCategories.find((cat) => cat.name === selectedCategory)
    const subcategory = category?.subcategories.find((sub) => sub.name === subcategoryName)
    setAvailableSubSubcategories(subcategory ? subcategory.sub_subcategories : [])
  }

  const handleSubSubcategoryChange = (subSubcategoryName) => {
    setSelectedSubSubcategory(subSubcategoryName)
  }

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const addToArray = (section, field, value) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: [...prev[section][field], value.trim()],
        },
      }))
    }
  }

  const removeFromArray = (section, field, index) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index),
      },
    }))
  }

  const handleNewImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    const maxSizeBytes = 5 * 1024 * 1024 // 5MB limit

    setIsCompressing(true)

    try {
      const processedFiles = []

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          alert(`${file.name} is not a valid image file.`)
          continue
        }

        // Check file size and compress if needed
        if (file.size > maxSizeBytes) {
          console.log(`Compressing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
          const compressedFile = await compressImage(file)

          if (compressedFile.size > maxSizeBytes) {
            // Try with lower quality
            const recompressedFile = await compressImage(file, 3, 0.6)
            processedFiles.push(recompressedFile)
          } else {
            processedFiles.push(compressedFile)
          }
        } else {
          processedFiles.push(file)
        }
      }

      setFormData((prev) => ({
        ...prev,
        newImages: [...prev.newImages, ...processedFiles],
      }))
    } catch (error) {
      console.error("Error processing images:", error)
      alert("Error processing images. Please try again.")
    } finally {
      setIsCompressing(false)
    }
  }

  const removeNewImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
    }))
  }

  const removeExistingImage = (imageName) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== imageName),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedCategory) {
      alert("Please select at least a main category.")
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSubmit = new FormData()

      // Add basic fields
      formDataToSubmit.append("title", formData.title)
      formDataToSubmit.append("description", formData.description)
      formDataToSubmit.append("hsc", formData.hsc)
      formDataToSubmit.append("keywords", formData.keywords)

      formDataToSubmit.append("category", selectedCategory)
      if (selectedSubcategory) {
        formDataToSubmit.append("sub_category", selectedSubcategory)
      }
      if (selectedSubSubcategory) {
        formDataToSubmit.append("sub_sub_category", selectedSubSubcategory)
      }

      formDataToSubmit.append("price", Number.parseFloat(formData.price) || 0)
      formDataToSubmit.append("measurement", formData.measurement)
      formDataToSubmit.append("contact", formData.contact)
      formDataToSubmit.append("approvalStatus", "pending") // Reset to pending after edit

      // Handle existing images (keep the ones not removed)
      formData.images.forEach((imageName) => {
        formDataToSubmit.append("images", imageName)
      })

      // Add new images
      formData.newImages.forEach((image) => {
        formDataToSubmit.append("images", image)
      })

      // Add JSON fields
      formDataToSubmit.append("productDetails", JSON.stringify(formData.productDetails))
      formDataToSubmit.append("specifications", JSON.stringify(formData.specifications))

      await pb.collection("products").update(params.id, formDataToSubmit)

      alert("Product updated successfully! It will be reviewed by admin again.")
      router.push("/dashboard/products")
    } catch (error) {
      console.error("Error updating product:", error)

      if (error.message?.includes("file size") || error.message?.includes("5242880")) {
        alert(
          "One or more images are too large. Please try with smaller images or let the system compress them automatically.",
        )
      } else {
        alert("Failed to update product. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || isFetchingProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  if (!currentUser || currentUser.userRole !== "seller" || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-red-600">Product not found or access denied.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AuthGuard redirectIfNotAuthenticated="/login">
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-4 mb-4">
              <Button onClick={() => router.push("/dashboard/products")} variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
            </div>
            <CardTitle className="text-2xl">Edit Product</CardTitle>
            <p className="text-gray-600">Update your product details</p>
            {product.approvalStatus === "approved" && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
                <p className="font-bold">Note:</p>
                <p>This product is currently approved. After editing, it will need admin approval again.</p>
              </div>
            )}
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
                    <Input id="hsc" value={formData.hsc} onChange={(e) => handleInputChange("hsc", e.target.value)} />
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

                {selectedCategory && (
                  <div className="p-3 bg-gray-100 rounded">
                    <p className="text-sm text-gray-600">Selected Category Path:</p>
                    <p className="font-medium">
                      {selectedCategory}
                      {selectedSubcategory && ` > ${selectedSubcategory}`}
                      {selectedSubSubcategory && ` > ${selectedSubSubcategory}`}
                    </p>
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
                    <Select
                      value={formData.measurement}
                      onValueChange={(value) => handleInputChange("measurement", value)}
                    >
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

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  <p>
                    <strong>Image Guidelines:</strong>
                  </p>
                  <p>• Maximum file size: 5MB per image</p>
                  <p>• Large images will be automatically compressed</p>
                  <p>• Supported formats: JPG, PNG, WebP</p>
                </div>

                {/* Existing Images */}
                {formData.images.length > 0 && (
                  <div>
                    <Label>Current Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {formData.images.map((imageName, index) => (
                        <div key={index} className="relative">
                          <img
                            src={pb.files.getUrl(product, imageName) || "/placeholder.svg"}
                            alt={`Product ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 w-6 h-6 p-0"
                            onClick={() => removeExistingImage(imageName)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images */}
                <div>
                  <Label htmlFor="newImages">Add New Images</Label>
                  <div className="mt-2">
                    <input
                      id="newImages"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleNewImageUpload}
                      className="hidden"
                      disabled={isCompressing}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("newImages").click()}
                      className="w-full"
                      disabled={isCompressing}
                    >
                      {isCompressing ? (
                        <>
                          <LoadingSpinner size={16} className="mr-2" />
                          Processing Images...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload New Images
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {formData.newImages.length > 0 && (
                  <div>
                    <Label>New Images to Add</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {formData.newImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image) || "/placeholder.svg"}
                            alt={`New ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b">
                            {(image.size / 1024 / 1024).toFixed(2)}MB
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 w-6 h-6 p-0"
                            onClick={() => removeNewImage(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
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
                        addToArray("productDetails", "exportCountries", newExportCountry)
                        setNewExportCountry("")
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
                        addToArray("productDetails", "relatedSectors", newRelatedSector)
                        setNewRelatedSector("")
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
                  onClick={() => router.push("/dashboard/products")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isCompressing} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size={16} className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Product"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
