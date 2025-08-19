"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { getClientPb } from "@/lib/pocketbase"
import { usePocketBaseFetchWithLoading } from "@/hooks/use-pocketbase-fetch"

function ProductsSection() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const pb = getClientPb()
  const scrollRef = useRef(null)

  // Fetch only featured products now
  const isLoading = usePocketBaseFetchWithLoading(async (signal) => {
    try {
      // Fetch featured products
      const products = await pb.collection("products").getList(1, 8, {
        filter: 'approvalStatus = "approved"',
        sort: "-created",
        signal,
      })
      setFeaturedProducts(products.items)
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching data:", error)
      }
    }
  }, [])

  return (
    <div>
      {/* Featured Products Section */}
      <section
        className="py-20 relative overflow-hidden"
        style={{
          background: `
          radial-gradient(circle at 20% 80%, rgba(41, 104, 138, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(41, 104, 138, 0.06) 0%, transparent 50%),
          linear-gradient(135deg, rgba(41, 104, 138, 0.02) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(41, 104, 138, 0.03) 100%),
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(41, 104, 138, 0.02) 2px,
            rgba(41, 104, 138, 0.02) 4px
          )
        `,
        }}
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full border border-[#29688A]/20"></div>
          <div className="absolute top-40 right-20 w-24 h-24 rounded-full border border-[#29688A]/15"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 rounded-full border border-[#29688A]/25"></div>
          <div className="absolute bottom-40 right-1/3 w-20 h-20 rounded-full border border-[#29688A]/20"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-[#29688A] to-[#29688A]/80 bg-clip-text text-transparent mb-2">
                Featured Products
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-[#29688A] to-[#29688A]/60 rounded-full mx-auto"></div>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover our carefully curated selection of latest and most popular items
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <div className="bg-gray-200 h-56 rounded-t-xl" />
                    <div className="p-6 space-y-3">
                      <div className="bg-gray-200 h-4 rounded-full" />
                      <div className="bg-gray-200 h-4 rounded-full w-2/3" />
                      <div className="bg-gray-200 h-6 rounded-full w-1/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <Card className="group hover:shadow-2xl hover:shadow-[#29688A]/20 transition-all duration-500 cursor-pointer border-0 bg-white/90 backdrop-blur-sm hover:-translate-y-2 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden rounded-t-xl">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#29688A]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                        <img
                          src={
                            product.images?.[0]
                              ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/products/${product.id}/${product.images[0]}`
                              : "/placeholder.svg?height=200&width=300"
                          }
                          alt={product.title}
                          className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-4 right-4 bg-[#29688A] text-white px-3 py-1 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Featured
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-gray-800 mb-3 line-clamp-2 text-lg group-hover:text-[#29688A] transition-colors duration-300">
                          {product.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-[#29688A] bg-gradient-to-r from-[#29688A] to-[#29688A]/80 bg-clip-text ">
                            ${product.price}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-[#29688A]/10 flex items-center justify-center group-hover:bg-[#29688A] transition-colors duration-300">
                            <ChevronRight className="w-4 h-4 text-[#29688A] group-hover:text-white transition-colors duration-300" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-16">
            <Link href="/products">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-[#29688A] text-[#29688A] hover:bg-[#29688A] hover:text-white transition-all duration-300 px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl hover:shadow-[#29688A]/25 bg-transparent"
              >
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProductsSection
