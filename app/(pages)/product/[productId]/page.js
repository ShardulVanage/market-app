"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Star, Heart, Phone, Mail, MapPin } from "lucide-react"
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

  const pb = getClientPb()
  const productId = params.productId

  const isLoading = usePocketBaseFetchWithLoading(
    async (signal) => {
      try {
        console.log("[v0] Fetching product details for:", productId)

        // Fetch product details
        const productData = await pb.collection("products").getOne(productId, {
          expand: "seller,company",
          signal,
          requestKey: `product-${productId}-${Date.now()}`,
        })

        setProduct(productData)
        setSeller(productData.expand?.seller)
        setCompany(productData.expand?.company)

        // Fetch related products
        if (productData.category) {
          const related = await pb.collection("products").getList(1, 4, {
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

  const {
    isFavorite,
    isLoading: favoritesLoading,
    toggleFavorite,
  } = useFavorites(product ? (productId) : null)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-muted h-8 w-32 rounded mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-muted h-96 rounded" />
              <div className="space-y-4">
                <div className="bg-muted h-8 rounded" />
                <div className="bg-muted h-4 rounded w-2/3" />
                <div className="bg-muted h-6 rounded w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const productImages = product.images || []
  const currentImage = productImages[selectedImageIndex]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Products</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border">
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
              <div className="flex space-x-2 overflow-x-auto">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                      selectedImageIndex === index ? "border-primary" : "border-muted"
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
              <div className="flex flex-wrap gap-2 mb-3">
                {product.category && <Badge variant="secondary">{product.category}</Badge>}
                {product.sub_category && <Badge variant="outline">{product.sub_category}</Badge>}
                {product.sub_sub_category && <Badge variant="outline">{product.sub_sub_category}</Badge>}
              </div>

              <h1 className="text-3xl font-bold text-foreground mb-4">{product.title}</h1>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                    />
                  ))}
                  <span className="ml-2 text-muted-foreground">(4.5) • 23 reviews</span>
                </div>
              </div>

              <div className="text-3xl font-bold text-primary mb-6">
                ${product.price}
                {product.measurement && (
                  <span className="text-lg text-muted-foreground font-normal">/{product.measurement}</span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {product.keywords && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {product.keywords.split(",").map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <InquiryDialog product={product} seller={seller} />
              <Button
                variant="outline"
                size="lg"
                onClick={toggleFavorite}
                disabled={favoritesLoading}
                className={isFavorite ? "text-red-500 border-red-500" : ""}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
              <ShareButton product={product} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Details & Specifications */}
          <div className="lg:col-span-2 space-y-8">
            {/* Product Details */}
            {product.productDetails && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(product.productDetails).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Specifications */}
            {product.specifications && (
              <Card>
                <CardHeader>
                  <CardTitle>Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* HSC Code */}
            {product.hsc && (
              <Card>
                <CardHeader>
                  <CardTitle>HSC Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-mono">{product.hsc}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Seller Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company && (
                  <div>
                    <h4 className="font-semibold text-lg">{company.name}</h4>
                    <p className="text-muted-foreground">{company.description}</p>
                  </div>
                )}

                {seller && (
                  <div>
                    <h5 className="font-medium">Contact Person</h5>
                    <p className="text-muted-foreground">{seller.name}</p>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  {product.contact && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{product.contact}</span>
                    </div>
                  )}

                  {seller?.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{seller.email}</span>
                    </div>
                  )}

                  {company?.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <span className="text-sm">{company.address}</span>
                    </div>
                  )}
                </div>

                <InquiryDialog
                  product={product}
                  seller={seller}
                  trigger={
                    <Button className="w-full">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Seller
                    </Button>
                  }
                />
              </CardContent>
            </Card>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {relatedProducts.map((relatedProduct) => (
                      <Link key={relatedProduct.id} href={`/product/${relatedProduct.id}`}>
                        <div className="flex space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <img
                            src={
                              relatedProduct.images?.[0]
                                ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/products/${relatedProduct.id}/${relatedProduct.images[0]}`
                                : "/placeholder.svg?height=60&width=60"
                            }
                            alt={relatedProduct.title}
                            className="w-15 h-15 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm line-clamp-2">{relatedProduct.title}</h5>
                            <p className="text-primary font-semibold">${relatedProduct.price}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
