"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Grid, List, Star, ArrowLeft } from "lucide-react"
import { getClientPb } from "@/lib/pocketbase"
import { usePocketBaseFetchWithLoading } from "@/hooks/use-pocketbase-fetch"
import { getAllCategories } from "@/lib/categories"

export default function AllProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [sortBy, setSortBy] = useState("created")
  const [viewMode, setViewMode] = useState("grid")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const categories = getAllCategories()

  const pb = getClientPb()
  const itemsPerPage = 16

  const handleSearch = () => {
    setSearchQuery(searchInput)
    setCurrentPage(1)
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchInput("")
    setSearchQuery("")
    setCurrentPage(1)
  }

  const isLoading = usePocketBaseFetchWithLoading(
    async (signal) => {
      try {
        let filter = 'approvalStatus = "approved"'

        if (selectedCategory && selectedCategory !== "all") {
          filter += ` && category ~ "${selectedCategory}"`
        }

        if (searchQuery) {
          filter += ` && (title ~ "${searchQuery}" || description ~ "${searchQuery}" || keywords ~ "${searchQuery}")`
        }

        const products = await pb.collection("products").getList(currentPage, itemsPerPage, {
          filter,
          sort: sortBy === "price_asc" ? "+price" : sortBy === "price_desc" ? "-price" : "-" + sortBy,
          signal,
        })

        setProducts(products.items)
        setTotalItems(products.totalItems)
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching products:", error)
        }
      }
    },
    [currentPage, searchQuery, sortBy, selectedCategory],
  )

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`,
      }}
    >
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, #29688A15 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, #29688A10 0%, transparent 50%),
              linear-gradient(45deg, transparent 40%, #29688A05 50%, transparent 60%)
            `,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                #29688A08 20px,
                #29688A08 21px
              )
            `,
          }}
        />
      </div>

      <header
        className="relative border-b backdrop-blur-sm shadow-lg "
        style={{
          background: `linear-gradient(135deg, #29688A 0%, #1e5a7a 100%)`,
        }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-3 text-white hover:text-blue-100 transition-colors group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              All Products
            </h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <div className="relative container mx-auto px-4 py-8">
        <div className="mb-8 space-y-6">
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <div className="relative flex">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
                      style={{ color: "#29688A" }}
                    />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="pl-12 h-12 rounded-r-none border-2 border-r-0 focus:ring-2 transition-all"
                      style={{
                        borderColor: "#29688A40",
                        "--tw-ring-color": "#29688A40",
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="rounded-l-none border-l-0 h-12 px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    type="button"
                    style={{
                      background: `linear-gradient(135deg, #29688A 0%, #1e5a7a 100%)`,
                    }}
                  >
                    Search
                  </Button>
                </div>
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger
                  className="w-full md:w-60 h-12 border-2 font-medium"
                  style={{ borderColor: "#29688A40" }}
                >
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger
                  className="w-full md:w-60 h-12 border-2 font-medium"
                  style={{ borderColor: "#29688A40" }}
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Newest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="title">Name A-Z</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border-2 rounded-lg overflow-hidden" style={{ borderColor: "#29688A40" }}>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none h-12 px-4"
                  style={
                    viewMode === "grid"
                      ? {
                          background: `linear-gradient(135deg, #29688A 0%, #1e5a7a 100%)`,
                        }
                      : {}
                  }
                >
                  <Grid className="h-5 w-5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none h-12 px-4"
                  style={
                    viewMode === "list"
                      ? {
                          background: `linear-gradient(135deg, #29688A 0%, #1e5a7a 100%)`,
                        }
                      : {}
                  }
                >
                  <List className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              {selectedCategory && selectedCategory !== "all" && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer px-4 py-2 text-sm font-medium hover:scale-105 transition-transform shadow-md"
                  onClick={() => setSelectedCategory("all")}
                  style={{
                    background: `linear-gradient(135deg, #29688A20 0%, #1e5a7a20 100%)`,
                    color: "#29688A",
                    border: "1px solid #29688A40",
                  }}
                >
                  {selectedCategory} ×
                </Badge>
              )}
              {searchQuery && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer px-4 py-2 text-sm font-medium hover:scale-105 transition-transform shadow-md"
                  onClick={clearSearch}
                  style={{
                    background: `linear-gradient(135deg, #29688A20 0%, #1e5a7a20 100%)`,
                    color: "#29688A",
                    border: "1px solid #29688A40",
                  }}
                >
                  Search: {searchQuery} ×
                </Badge>
              )}
              {(selectedCategory !== "all" || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("all")
                    clearSearch()
                  }}
                  className="px-4 py-2 font-medium border-2 hover:scale-105 transition-all duration-300"
                  style={{
                    borderColor: "#29688A",
                    color: "#29688A",
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="backdrop-blur-sm bg-white/60 rounded-xl p-4 inline-block shadow-md">
            <p className="font-semibold" style={{ color: "#29688A" }}>
              Showing {products.length} of {totalItems} products
            </p>
          </div>
        </div>

        {/* Products Grid/List */}
        {isLoading ? (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "space-y-6"
            }
          >
            {[...Array(12)].map((_, i) => (
              <Card
                key={i}
                className="animate-pulse backdrop-blur-sm bg-white/80 border-0 shadow-lg rounded-2xl overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-48 rounded-t-2xl" />
                  <div className="p-6 space-y-3">
                    <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-4 rounded-full" />
                    <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-4 rounded-full w-2/3" />
                    <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-6 rounded-full w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-12 shadow-lg inline-block">
              <p className="text-xl font-semibold mb-6" style={{ color: "#29688A" }}>
                No products found
              </p>
              <Button
                onClick={() => {
                  clearSearch()
                  setSelectedCategory("all")
                }}
                className="px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, #29688A 0%, #1e5a7a 100%)`,
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-screen-2xl mx-auto" : "space-y-10 max-w-5xl mx-auto"
            }
          >
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <Card className="group mt-6 hover:shadow-2xl transition-all duration-500 cursor-pointer h-full backdrop-blur-sm bg-white/90 border-0 rounded-2xl overflow-hidden hover:scale-101 hover:-translate-y-2">
                  <CardContent className={viewMode === "grid" ? "p-0" : "p-0 flex"}>
                    <div
                      className={`relative overflow-hidden ${viewMode === "grid" ? "rounded-t-2xl" : "rounded-l-2xl w-80 flex-shrink-0"}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <img
                        src={
                          product.images?.[0]
                            ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/products/${product.id}/${product.images[0]}`
                            : "/placeholder.svg?height=200&width=300"
                        }
                        alt={product.title}
                        className={`object-contain group-hover:scale-110 transition-transform duration-500 ${
                          viewMode === "grid" ? "w-full h-48" : "w-full h-48"
                        }`}
                      />
                    </div>
                    <div className="p-6 flex-1">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {product.category && (
                          <Badge
                            variant="outline"
                            className="text-xs px-3 py-1 font-medium border-2 rounded-full"
                            style={{
                              borderColor: "#29688A40",
                              color: "#29688A",
                              background: "#29688A10",
                            }}
                          >
                            {product.category}
                          </Badge>
                        )}
                      </div>
                      <h3
                        className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-[#29688A] transition-colors"
                        style={{ color: "#1f2937" }}
                      >
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold bg-gradient-to-r from-[#29688A] to-[#1e5a7a] bg-clip-text text-transparent">
                         ₹{product.price}
                        </span>
                        {/* <div className="flex items-center text-sm font-medium" style={{ color: "#29688A" }}>
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span>4.5</span>
                        </div> */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-16 space-x-3">
            <div className="backdrop-blur-sm bg-white/80 rounded-2xl p-2 shadow-lg flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-6 py-3 font-semibold border-2 rounded-xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
                style={{
                  borderColor: "#29688A40",
                  color: "#29688A",
                }}
              >
                Previous
              </Button>

              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i))
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    onClick={() => setCurrentPage(pageNum)}
                    className="px-4 py-3 font-semibold rounded-xl hover:scale-105 transition-all duration-300 min-w-[3rem]"
                    style={
                      currentPage === pageNum
                        ? {
                            background: `linear-gradient(135deg, #29688A 0%, #1e5a7a 100%)`,
                          }
                        : {
                            borderColor: "#29688A40",
                            color: "#29688A",
                          }
                    }
                  >
                    {pageNum}
                  </Button>
                )
              })}

              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-6 py-3 font-semibold border-2 rounded-xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
                style={{
                  borderColor: "#29688A40",
                  color: "#29688A",
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
