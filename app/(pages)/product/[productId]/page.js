"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Heart, Phone, Mail, MapPin, Building2, Calendar, Users, Globe,  ChevronDown,
  ChevronUp } from "lucide-react"
import { getClientPb } from "@/lib/pocketbase"
import { usePocketBaseFetchWithLoading } from "@/hooks/use-pocketbase-fetch"
import { InquiryDialog } from "@/components/inquiry-dialog"
import { useFavorites } from "@/hooks/use-favorites"
import { ShareButton } from "@/components/share-button"

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState(null)
  const [seller, setSeller] = useState(null)
  const [company, setCompany] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [user, setUser] = useState(null)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const pb = getClientPb()
  const productId = params.productId

  const isLoading = usePocketBaseFetchWithLoading(
    async (signal) => {
      try {
        console.log("[v0] Fetching product details for:", productId)

        // Check if user is logged in
        const currentUser = pb.authStore.model
        setUser(currentUser)

        // Fetch product details
        const productData = await pb.collection("products").getOne(productId, {
          expand: "seller,company",
          signal,
          requestKey: `product-${productId}-${Date.now()}`,
        })

        console.log("[v0] Product data received:", productData)

        setProduct(productData)
        setSeller(productData.expand?.seller)
        setCompany(productData.expand?.company)

        console.log("[v0] Seller data:", productData.expand?.seller)
        console.log("[v0] Product seller ID:", productData.seller)

        // Fetch related products
        if (productData.category) {
          const related = await pb.collection("products").getList(1, 8, {
            filter: `approvalStatus = "approved" && category = "${productData.category}" && id != "${productId}"`,
            sort: "-created",
            signal,
            requestKey: `related-${productId}-${Date.now()}`,
          })
          setRelatedProducts(related.items)
        }

        console.log("[v0] Product data loaded successfully")
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("[v0] Error fetching product:", error)
        }
      }
    },
    [productId],
  )

  const { isFavorite, isLoading: favoritesLoading, toggleFavorite } = useFavorites(product ? productId : null)

  const shouldTruncateDescription = (description) => {
    if (!description) return false
    const lines = description.split("\n")
    return lines.length > 8 || description.length > 600
  }

  const getTruncatedDescription = (description) => {
    if (!description) return ""
    const lines = description.split("\n")
    if (lines.length > 8) {
      return lines.slice(0, 8).join("\n")
    }
    if (description.length > 600) {
      return description.substring(0, 600) + "..."
    }
    return description
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 w-32 rounded mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-200 h-96 rounded-lg" />
              <div className="space-y-4">
                <div className="bg-gray-200 h-8 rounded" />
                <div className="bg-gray-200 h-4 rounded w-2/3" />
                <div className="bg-gray-200 h-6 rounded w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Product Not Found</h1>
          <Link href="/">
            <Button className="bg-[#29688A] hover:bg-[#1e4f6b] text-white">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const productImages = product.images || []
  const currentImage = productImages[selectedImageIndex]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-[#29688A] transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Products</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <img
                src={
                  currentImage
                    ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/products/${product.id}/${currentImage}`
                    : "/placeholder.svg?height=500&width=500"
                }
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {productImages.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-[#29688A] shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/products/${product.id}/${image}`}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {product.category && (
                  <Badge className="bg-[#29688A]/10 text-[#29688A] border-[#29688A]/20">{product.category}</Badge>
                )}
                {product.sub_category && (
                  <Badge variant="outline" className="border-gray-300">
                    {product.sub_category}
                  </Badge>
                )}
                {product.sub_sub_category && (
                  <Badge variant="outline" className="border-gray-300">
                    {product.sub_sub_category}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-9 leading-tight">{product.title}</h1>

              <div className="text-4xl font-bold text-[#29688A] mt-6">
                ₹{product.price}
                {product.measurement && (
                  <span className="text-lg text-gray-500 font-normal">/{product.measurement}</span>
                )}
              </div>
            </div>

             <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Description</h3>
              <div className="text-gray-600 leading-relaxed">
                <p className="whitespace-pre-line">
                  {shouldTruncateDescription(product.description) && !isDescriptionExpanded
                    ? getTruncatedDescription(product.description)
                    : product.description}
                </p>
                {shouldTruncateDescription(product.description) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2 p-0 h-auto text-[#29688A] hover:text-[#1e4f6b] hover:bg-transparent font-medium"
                  >
                    {isDescriptionExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Read Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Read More
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* HSC Code */}
            {product.hsc && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-900">
                  HSC Code: <span className="font-mono text-[#29688A]">{product.hsc}</span>
                </p>
              </div>
            )}

            {product.keywords && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {product.keywords.split(",").map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-gray-300 text-gray-600">
                      {keyword.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <InquiryDialog
                product={product}
                seller={seller}
                trigger={
                  <Button size="lg" className="bg-[#29688A] hover:bg-[#1e4f6b] text-white px-8">
                    <Phone className="h-5 w-5 mr-2" />
                    Send Inquiry
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="lg"
                onClick={toggleFavorite}
                disabled={favoritesLoading}
                className={`border-2 ${isFavorite ? "text-red-500 border-red-500 bg-red-50" : "border-gray-300 hover:border-[#29688A]"}`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
              <ShareButton product={product} />
            </div>
          </div>
        </div>

        <div className="mb-12">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 rounded-lg p-1">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-[#29688A] data-[state=active]:text-white font-medium"
              >
                Product Details
              </TabsTrigger>
              <TabsTrigger
                value="specifications"
                className="data-[state=active]:bg-[#29688A] data-[state=active]:text-white font-medium"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger
                value="seller"
                className="data-[state=active]:bg-[#29688A] data-[state=active]:text-white font-medium"
              >
                Seller Information
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-xl text-gray-900">Product Details</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {product.productDetails ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(product.productDetails).map(([key, value]) => (
                        <div key={key} className="flex flex-col space-y-1">
                          <span className="font-semibold text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, " $1")}
                          </span>
                          <span className="text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No product details available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className=" border-b border-gray-200">
                  <CardTitle className="text-xl text-gray-900">Specifications</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {product.specifications ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex flex-col space-y-1">
                          <span className="font-semibold text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, " $1")}
                          </span>
                          <span className="text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No specifications available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seller" className="mt-6">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className=" border-b border-gray-200">
                  <CardTitle className="text-xl text-gray-900">Seller Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {!user ? (
                    <div className="text-center py-8">
                      <div className="bg-[#29688A]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Building2 className="h-8 w-8 text-[#29688A]" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
                      <p className="text-gray-600 mb-4">Please log in to view seller information</p>
                      <Link href="/login">
                        <Button className="bg-[#29688A] hover:bg-[#1e4f6b] text-white">Login to View Details</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Company Information */}
                      {company && (
                        <div className="space-y-4">
                          <div className="md:flex flex-1  items-start space-x-4">
                            {company.companyLogo && (
                              <img
                                src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/companies/${company.id}/${company.companyLogo}`}
                                alt={company.companyName}
                                className="w-80 h-80 rounded-lg object-cover border border-gray-200"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-900">{company.companyName}</h4>
                              <p className="text-gray-600 mt-1">{company.description}</p>
                              {company.companyType && (
                                <Badge className="mt-2 bg-[#29688A]/10 text-[#29688A]">{company.companyType}</Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                            {company.foundedYear && (
                              <div className="flex items-center space-x-3">
                                <Calendar className="h-5 w-5 text-[#29688A]" />
                                <div>
                                  <span className="text-sm text-gray-500">Founded</span>
                                  <p className="font-medium text-gray-900">{company.foundedYear}</p>
                                </div>
                              </div>
                            )}
                            {company.employeeCount && (
                              <div className="flex items-center space-x-3">
                                <Users className="h-5 w-5 text-[#29688A]" />
                                <div>
                                  <span className="text-sm text-gray-500">Employees</span>
                                  <p className="font-medium text-gray-900">{company.employeeCount}</p>
                                </div>
                              </div>
                            )}
                            {company.website && (
                              <div className="flex items-center space-x-3">
                                <Globe className="h-5 w-5 text-[#29688A]" />
                                <div>
                                  <span className="text-sm text-gray-500">Website</span>
                                  <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-[#29688A] hover:underline"
                                  >
                                    {company.website}
                                  </a>
                                </div>
                              </div>
                            )}
                            {company.annualTurnover && (
                              <div className="flex items-center space-x-3">
                                <Building2 className="h-5 w-5 text-[#29688A]" />
                                <div>
                                  <span className="text-sm text-gray-500">Annual Turnover</span>
                                  <p className="font-medium text-gray-900">{company.annualTurnover}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Contact Person */}
                      {/* {seller && (
                        <div className="space-y-4">
                          <h5 className="font-semibold text-gray-900">Contact Person</h5>
                          <div className="flex items-start space-x-4">
                            {seller.avatar && (
                              <img
                                src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/_pb_users_auth_/${seller.id}/${seller.avatar}`}
                                alt="Contact person"
                                className="w-12 h-12 rounded-full object-cover border border-gray-200"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {seller.firstName && seller.lastName
                                  ? `${seller.prefix || ""} ${seller.firstName} ${seller.lastName}`.trim()
                                  : seller.name || seller.email}
                              </p>
                              {seller.designation && <p className="text-sm text-gray-600">{seller.designation}</p>}
                              {seller.organizationName && (
                                <p className="text-sm text-gray-600">{seller.organizationName}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )} */}

            

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h5 className="font-semibold text-gray-900">Contact Address</h5>
                        <div className="grid grid-cols-1 gap-4">
                         
                          {company?.address && (
                            <div className="flex items-start space-x-3">
                              <MapPin className="h-5 w-5 text-[#29688A] mt-1" />
                              <div className="text-gray-900">
                                <p>{company.address}</p>
                                {(company.city || company.state || company.country) && (
                                  <p className="text-sm text-gray-600">
                                    {[company.city, company.state, company.country].filter(Boolean).join(", ")}
                                    {company.pincode && ` - ${company.pincode}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4">
                        <InquiryDialog
                          product={product}
                          seller={seller}
                          trigger={
                            <Button className="w-full bg-[#29688A] hover:bg-[#1e4f6b] text-white">
                              <Phone className="h-4 w-4 mr-2" />
                              Contact Seller
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Related Products</h2>
              <p className="text-gray-600">Discover similar products you might like</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} href={`/product/${relatedProduct.id}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-[#29688A]/30 bg-white">
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={
                          relatedProduct.images?.[0]
                            ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/products/${relatedProduct.id}/${relatedProduct.images[0]}`
                            : "/placeholder.svg?height=200&width=200"
                        }
                        alt={relatedProduct.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-[#29688A] transition-colors">
                        {relatedProduct.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-[#29688A]">${relatedProduct.price}</p>
                        {relatedProduct.category && (
                          <Badge variant="outline" className="text-xs border-gray-300">
                            {relatedProduct.category}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
