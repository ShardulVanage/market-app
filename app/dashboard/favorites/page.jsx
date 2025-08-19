"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ArrowLeft, Eye, MessageCircle, Share2 } from "lucide-react"
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

      setFavorites(records.items )
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">My Favorites</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">My Favorites</h1>
        <Badge variant="secondary">{favorites.length} items</Badge>
      </div>

      {favorites.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-4">Start adding products to your favorites to see them here</p>
            <Button onClick={() => router.push("/products")}>Browse Products</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => {
            const product = favorite.expand?.product
            if (!product) return null

            return (
              <Card key={favorite.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={getImageUrl(product, product.images[0]) || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => removeFavorite(favorite.id)}
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                    <Badge variant={product.status === "approved" ? "default" : "secondary"}>{product.status}</Badge>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-green-600">
                        {product.currency} {product.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.category} • {product.subcategory}
                    </div>
                  </div>

                  {product.expand?.seller && (
                    <div className="text-sm text-gray-600 mb-4">Seller: {product.expand.seller.name}</div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => router.push(`/product/${product.id}`)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/product/${product.id}#contact`)}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
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
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
