"use client"

import { useState, useEffect } from "react"
import { getClientPb } from "@/lib/pocketbase"
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"

export function useFavorites(productId) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { currentUser } = useAuth()
  const pb = getClientPb()

  useEffect(() => {
    if (!currentUser || !productId) return

    const abortController = new AbortController()

    const checkFavorite = async () => {
      try {
        const favorites = await pb.collection("favorites").getList(
          1,
          1,
          {
            filter: `user = "${currentUser.id}" && product = "${productId}"`,
          },
          {
            signal: abortController.signal,
          },
        )

        if (!abortController.signal.aborted) {
          setIsFavorite(favorites.items.length > 0)
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error checking favorite status:", error)
        }
      }
    }

    checkFavorite()

    return () => {
      abortController.abort()
    }
  }, [currentUser, productId, pb])

  const toggleFavorite = async () => {
    console.log("[v0] Toggle favorite clicked - User:", currentUser, "Product ID:", productId)

    if (!currentUser) {
      console.log("[v0] No user found, showing auth toast")
      toast({
        title: "Authentication Required",
        description: "Please log in to add favorites.",
        variant: "destructive",
      })
      return
    }

    if (currentUser.profileStatus !== "approved") {
      console.log("[v0] User profile not approved:", currentUser.profileStatus)
      toast({
        title: "Profile Approval Required",
        description: "Your profile must be approved before you can add favorites.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const abortController = new AbortController()

    try {
      if (isFavorite) {
        const favorites = await pb.collection("favorites").getList(
          1,
          1,
          {
            filter: `user = "${currentUser.id}" && product = "${productId}"`,
          },
          {
            signal: abortController.signal,
          },
        )

        if (favorites.items.length > 0 && !abortController.signal.aborted) {
          await pb.collection("favorites").delete(favorites.items[0].id)
          setIsFavorite(false)
          toast({
            title: "Removed from Favorites",
            description: "Product removed from your favorites.",
          })
        }
      } else {
        await pb.collection("favorites").create({
          user: currentUser.id,
          product: productId,
        })
        if (!abortController.signal.aborted) {
          setIsFavorite(true)
          toast({
            title: "Added to Favorites",
            description: "Product added to your favorites.",
          })
        }
      }
    } catch (error) {
      if (error.name !== "AbortError" && !abortController.signal.aborted) {
        console.error("Error toggling favorite:", error)
        toast({
          title: "Error",
          description: "Failed to update favorites. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false)
      }
    }
  }

  return {
    isFavorite,
    isLoading,
    toggleFavorite,
  }
}
