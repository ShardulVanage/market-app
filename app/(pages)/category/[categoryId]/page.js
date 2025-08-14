"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Grid, List, Star, ArrowLeft } from "lucide-react"
import { getClientPb } from "@/lib/pocketbase"
import { usePocketBaseFetchWithLoading } from "@/hooks/use-pocketbase-fetch"
import { getSubcategories, getSubSubcategories } from "@/lib/categories"

export default function CategoryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams.get("search") || "")
  const [sortBy, setSortBy] = useState("created")
  const [viewMode, setViewMode] = useState("grid")
  const [selectedSubCategory, setSelectedSubCategory] = useState("all")
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState("all")
  const [subCategories, setSubCategories] = useState([])
  const [subSubCategories, setSubSubCategories] = useState([])

  const pb = getClientPb()
  const categoryName = decodeURIComponent(params.categoryId )
  const itemsPerPage = 12

  useEffect(() => {
    const subCats = getSubcategories(categoryName)
    setSubCategories(subCats)
  }, [categoryName])

  useEffect(() => {
    if (selectedSubCategory && selectedSubCategory !== "all") {
      const subSubCats = getSubSubcategories(categoryName, selectedSubCategory)
      setSubSubCategories(subSubCats)
    } else {
      setSubSubCategories([])
    }
  }, [categoryName, selectedSubCategory])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery, selectedSubCategory, selectedSubSubCategory, sortBy])

  const isLoading = usePocketBaseFetchWithLoading(
    async (signal) => {
      try {
        let filter = `approvalStatus = "approved" && category = "${categoryName}"`

        if (selectedSubCategory && selectedSubCategory !== "all") {
          filter += ` && sub_category = "${selectedSubCategory}"`
        }

        if (selectedSubSubCategory && selectedSubSubCategory !== "all") {
          filter += ` && sub_sub_category = "${selectedSubSubCategory}"`
        }

        if (debouncedSearchQuery) {
          filter += ` && (title ~ "${debouncedSearchQuery}" || description ~ "${debouncedSearchQuery}" || keywords ~ "${debouncedSearchQuery}")`
        }

        const products = await pb.collection("products").getList(currentPage, itemsPerPage, {
          filter,
          sort: sortBy === "price_asc" ? "+price" : sortBy === "price_desc" ? "-price" : "-" + sortBy,
          signal,
        })

        setProducts(products.items)
        setTotalItems(products.totalItems)
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Request was cancelled (this is normal)")
        } else if (error.message?.includes("autocancelled")) {
          console.log("Request was auto-cancelled by PocketBase (this is normal)")
        } else {
          console.error("Error fetching products:", error)
        }
      }
    },
    [categoryName, currentPage, debouncedSearchQuery, sortBy, selectedSubCategory, selectedSubSubCategory],
  )

  useEffect(() => {
    if (selectedSubCategory === "all") {
      setSelectedSubSubCategory("all")
    }
  }, [selectedSubCategory])

  const clearAllFilters = useCallback(() => {
    setSearchQuery("")
    setDebouncedSearchQuery("")
    setSelectedSubCategory("all")
    setSelectedSubSubCategory("all")
    setCurrentPage(1)
  }, [])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <h1 className="text-2xl font-bold">{categoryName}</h1>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search in this category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery !== debouncedSearchQuery && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>

            <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sub Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sub Categories</SelectItem>
                {subCategories.map((subCat) => (
                  <SelectItem key={subCat} value={subCat}>
                    {subCat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSubCategory !== "all" && subSubCategories.length > 0 && (
              <Select value={selectedSubSubCategory} onValueChange={setSelectedSubSubCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sub Sub Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub Categories</SelectItem>
                  {subSubCategories.map((subSubCat) => (
                    <SelectItem key={subSubCat} value={subSubCat}>
                      {subSubCat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="title">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedSubCategory && selectedSubCategory !== "all" && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedSubCategory("all")}>
                {selectedSubCategory} ×
              </Badge>
            )}
            {selectedSubSubCategory && selectedSubSubCategory !== "all" && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedSubSubCategory("all")}>
                {selectedSubSubCategory} ×
              </Badge>
            )}
            {debouncedSearchQuery && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery("")}>
                Search: {debouncedSearchQuery} ×
              </Badge>
            )}
            {(selectedSubCategory !== "all" || selectedSubSubCategory !== "all" || debouncedSearchQuery) && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {products.length} of {totalItems} products
            {searchQuery !== debouncedSearchQuery && " (searching...)"}
          </p>
        </div>

        {isLoading ? (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
            }
          >
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="bg-muted h-48 rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <div className="bg-muted h-4 rounded" />
                    <div className="bg-muted h-4 rounded w-2/3" />
                    <div className="bg-muted h-6 rounded w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">No products found</p>
            <Button onClick={clearAllFilters}>Clear Filters</Button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
            }
          >
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
                  <CardContent className={viewMode === "grid" ? "p-0" : "p-0 flex"}>
                    <div
                      className={`relative overflow-hidden ${viewMode === "grid" ? "rounded-t-lg" : "rounded-l-lg w-48 flex-shrink-0"}`}
                    >
                      <img
                        src={
                          product.images?.[0]
                            ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/products/${product.id}/${product.images[0]}`
                            : "/placeholder.svg?height=200&width=300"
                        }
                        alt={product.title}
                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                          viewMode === "grid" ? "w-full h-48" : "w-full h-32"
                        }`}
                      />
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.sub_category && (
                          <Badge variant="outline" className="text-xs">
                            {product.sub_category}
                          </Badge>
                        )}
                        {product.sub_sub_category && (
                          <Badge variant="outline" className="text-xs">
                            {product.sub_sub_category}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{product.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">${product.price}</span>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span>4.5</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-12 space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
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
                >
                  {pageNum}
                </Button>
              )
            })}

            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
