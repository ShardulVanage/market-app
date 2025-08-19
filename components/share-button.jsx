"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"



export function ShareButton({ product, className }) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/product/${product.id}` : ""
  const shareText = `Check out this product: ${product.title}`

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error sharing:", error)
          toast({
            title: "Share Failed",
            description: "Failed to share the product.",
            variant: "destructive",
          })
        }
      }
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: "Link Copied",
        description: "Product link copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      })
    }
  }

  // Check if native sharing is supported
  const supportsNativeShare = typeof navigator !== "undefined" && navigator.share

  if (supportsNativeShare) {
    return (
      <Button variant="outline" size="lg" onClick={handleNativeShare} className={className}>
        <Share2 className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="lg" className={className}>
          <Share2 className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyToClipboard}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
