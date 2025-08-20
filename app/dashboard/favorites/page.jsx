"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  ArrowLeft, 
  Eye, 
  MessageCircle, 
  Share2, 
  Package, 
  User, 
  Tag,
  Calendar,
  Trash2
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getClientPb } from "@/lib/pocketbase"
import { toast } from "@/hooks/use-toast"

export default function FavoritesPage() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const pb = getClientPb()

  useEffect(() => {
    if (!currentUser) {
      router.push("/login")
      return
    }

    const abortController = new AbortController()
    fetchFavorites(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [currentUser, router])

  const fetchFavorites = async (signal) => {
    try {
      setLoading(true)
      const records = await pb.collection("favorites").getList(1, 50, {
        filter: `user = "${currentUser?.id}"`,
        expand: "product,product.seller",
        sort: "-created",
        requestKey: `favorites-${currentUser?.id}`,
        signal,
      })

      if (signal?.aborted) return

      setFavorites(records.items)
    } catch (error) {
      if (error.name === "AbortError" || error.message?.includes("autocancelled")) {
        return
      }
      console.error("Error fetching favorites:", error)
      toast({
        title: "Error",
        description: "Failed to load your favorites",
        variant: "destructive",
      })
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  const removeFavorite = async (favoriteId) => {
    try {
      await pb.collection("favorites").delete(favoriteId, {
        requestKey: `delete-favorite-${favoriteId}`,
      })
      setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId))
      toast({
        title: "Success",
        description: "Removed from favorites",
      })
    } catch (error) {
      if (error.name === "AbortError" || error.message?.includes("autocancelled")) {
        return
      }
      console.error("Error removing favorite:", error)
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      })
    }
  }

  const getImageUrl = (product, filename) => {
    return pb.files.getUrl(product, filename)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse border border-gray-100">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-64 h-48 bg-gray-100"></div>
            <div className="flex-1 p-6 space-y-3">
              <div className="h-5 bg-gray-100 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              <div className="h-4 bg-gray-100 rounded w-full"></div>
              <div className="h-6 bg-gray-100 rounded w-1/3"></div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-50 rounded-full mb-6">
        <Heart className="h-12 w-12 text-gray-300" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">No favorites yet</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Start exploring products and add them to your favorites to keep track of items you're interested in.
      </p>
      <Button 
        onClick={() => router.push("/products")}
        className="bg-[#29688A] hover:bg-[#1f4f6b] text-white px-8"
      >
        <Package className="h-4 w-4 mr-2" />
        Browse Products
      </Button>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="text-gray-600 hover:text-[#29688A] hover:bg-[#29688A]/5"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse"></div>
                <div className="h-6 w-32 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="text-gray-600 hover:text-[#29688A] hover:bg-[#29688A]/5"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#29688A] rounded-full flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">My Favorites</h1>
                  <p className="text-sm text-gray-600">{favorites.length} saved items</p>
                </div>
              </div>
            </div>
            {favorites.length > 0 && (
              <Badge variant="secondary" className="bg-[#29688A]/10 text-[#29688A] border-[#29688A]/20">
                {favorites.length} items
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {favorites.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {favorites.map((favorite) => {
              const product = favorite.expand?.product
              if (!product) return null

              return (
                <Card 
                  key={favorite.id} 
                  className="border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-[#29688A]/20"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image Section */}
                    <div className="relative w-full md:w-64 h-48 md:h-auto">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={getImageUrl(product, product.images[0]) || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-contain md:rounded-l-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center md:rounded-l-lg">
                          <Package className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      
                      {/* Remove from favorites button */}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-3 right-3 w-8 h-8 p-0 bg-white/90 hover:bg-white text-red-500 hover:text-red-600 shadow-sm"
                        onClick={() => removeFavorite(favorite.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-1 line-clamp-2">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Tag className="h-3 w-3" />
                              <span>{product.category}</span>
                              {product.subcategory && (
                                <>
                                  <span>•</span>
                                  <span>{product.subcategory}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant={product.status === "approved" ? "default" : "secondary"}
                            className={product.status === "approved" 
                              ? "bg-green-100 text-green-700 border-green-200" 
                              : "bg-gray-100 text-gray-700 border-gray-200"
                            }
                          >
                            {product.status}
                          </Badge>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {product.description}
                        </p>

                        {/* Price */}
                        <div className="mb-4">
                          <span className="text-2xl font-bold text-[#29688A]">
                            {product.currency} {product.price.toLocaleString()}
                          </span>
                        </div>

                        {/* Seller Info */}
                        {product.expand?.seller && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <User className="h-3 w-3" />
                            <span>Seller: {product.expand.seller.name}</span>
                          </div>
                        )}

                        {/* Added date */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                          <Calendar className="h-3 w-3" />
                          <span>Added on {formatDate(favorite.created)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-auto">
                          <Button 
                            className="flex-1 bg-[#29688A] hover:bg-[#1f4f6b] text-white" 
                            onClick={() => router.push(`/product/${product.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {/* <Button 
                            variant="outline" 
                            className="border-gray-200 hover:border-[#29688A] hover:text-[#29688A]" 
                            onClick={() => router.push(`/product/${product.id}#contact`)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button> */}
                          <Button
                            variant="outline"
                            className="border-gray-200 hover:border-[#29688A] hover:text-[#29688A]"
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({
                                  title: product.name,
                                  url: `${window.location.origin}/product/${product.id}`,
                                })
                              } else {
                                navigator.clipboard.writeText(`${window.location.origin}/product/${product.id}`)
                                toast({ title: "Link copied to clipboard" })
                              }
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}