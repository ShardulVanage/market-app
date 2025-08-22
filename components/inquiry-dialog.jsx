"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"
import { MessageSquare, Send, LogIn, Clock } from "lucide-react"

export function InquiryDialog({ product = null, requirement = null, seller, trigger }) {
  const { currentUser, pb } = useAuth()
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showProfilePendingPrompt, setShowProfilePendingPrompt] = useState(false)

  // Determine if this is for a product or requirement
  const isProductInquiry = !!product
  const isRequirementInquiry = !!requirement
  const itemData = product || requirement

  const handleTriggerClick = (e) => {
    e.preventDefault()
    if (!currentUser) {
      setShowLoginPrompt(true)
      return
    }
    if (currentUser.profileStatus !== "approved") {
      setShowProfilePendingPrompt(true)
      return
    }
    setIsOpen(true)
  }

  const handleLoginRedirect = () => {
    setShowLoginPrompt(false)
    router.push("/login")
  }

  const handleSubmitInquiry = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send an inquiry.",
        variant: "destructive",
      })
      return
    }

    if (currentUser.profileStatus !== "approved") {
      toast({
        title: "Profile Approval Required",
        description: "Your profile must be approved before you can send inquiries.",
        variant: "destructive",
      })
      return
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message for your inquiry.",
        variant: "destructive",
      })
      return
    }

    // Validate that we have either a product or requirement
    if (!isProductInquiry && !isRequirementInquiry) {
      toast({
        title: "Invalid Request",
        description: "Either product or requirement must be provided.",
        variant: "destructive",
      })
      return
    }

    let buyerId = null
    let sellerId = null

    if (isProductInquiry && product) {
      // For product inquiries: current user (buyer) contacts product owner (seller)
      buyerId = currentUser.id
      sellerId = product.seller || seller?.id
    } else if (isRequirementInquiry && requirement) {
      buyerId = requirement.userId || seller?.id // The requirement poster is the buyer
      sellerId = currentUser.id // Current user is the seller offering services
    }

    if (!sellerId || !buyerId) {
      toast({
        title: "Contact Information Missing",
        description: "Unable to identify the recipient for this inquiry.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] Inquiry type:", isProductInquiry ? "product" : "requirement")
    console.log("[v0] Buyer ID:", buyerId, "Seller ID:", sellerId)

    setIsSubmitting(true)

    try {
      const inquiryData = {
        buyer: buyerId,
        seller: sellerId,
        message: message.trim(),
        approvalStatus: "pending",
        status: "sent",
        chat: [],
      }

      // Add product or requirement based on what's provided
      if (isProductInquiry) {
        inquiryData.product = product.id
      }

      if (isRequirementInquiry) {
        inquiryData.requirement = requirement.id
      }

      console.log("[v0] Creating inquiry with data:", inquiryData)

      const result = await pb.collection("inquiries").create(inquiryData)

      toast({
        title: "Inquiry Sent Successfully",
        description: `Your ${isProductInquiry ? "product inquiry" : "proposal"} has been sent successfully. You'll be notified once it's approved.`,
      })

      setMessage("")
      setIsOpen(false)
    } catch (error) {
      console.error("Error sending inquiry:", error)
      toast({
        title: "Failed to Send Inquiry",
        description: `There was an error sending your inquiry: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDialogTitle = () => {
    if (isProductInquiry) return "Contact Seller"
    if (isRequirementInquiry) return "Send Proposal"
    return "Send Inquiry"
  }

  const getDialogDescription = () => {
    const itemTitle = itemData?.title || itemData?.quoteFor || "this item"
    const actionText = isProductInquiry ? "Send a message to the seller" : "Send your proposal to the buyer"

    return `${actionText} about "${itemTitle}". Your inquiry will be reviewed before you can start chatting.`
  }

  const getItemDetailsTitle = () => {
    return isProductInquiry ? "Product Details" : "Requirement Details"
  }

  const getRecipientTitle = () => {
    return isProductInquiry ? "Seller Information" : "Buyer Information"
  }

  const getPlaceholderText = () => {
    if (isProductInquiry) {
      return "Hi, I'm interested in this product. Could you please provide more details about..."
    }
    return "Hi, I'd like to submit a proposal for your requirement. I have experience in..."
  }

  const defaultTrigger = (
    <Button size="lg" className="flex-1" onClick={handleTriggerClick}>
      <MessageSquare className="h-5 w-5 mr-2" />
      {getDialogTitle()}
    </Button>
  )

  return (
    <>
      <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Login Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to send an inquiry. Would you like to log in now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoginRedirect}>Go to Login</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showProfilePendingPrompt} onOpenChange={setShowProfilePendingPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Profile Approval Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your profile is currently {currentUser?.profileStatus || "pending"} and needs to be approved before you
              can send inquiries. Please wait for admin approval or contact support if you have questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowProfilePendingPrompt(false)}>Understood</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {trigger ? (
        <div onClick={handleTriggerClick} style={{ cursor: "pointer" }}>
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inquiry-message">Your Message</Label>
              <Textarea
                id="inquiry-message"
                placeholder={getPlaceholderText()}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
                maxLength={500}
              />
              <p className="text-sm text-muted-foreground">{message.length}/500 characters</p>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-1">{getItemDetailsTitle()}</h4>
              <p className="text-sm text-muted-foreground">
                {itemData?.title || itemData?.quoteFor || "No title available"}
              </p>
              {itemData?.price && <p className="text-sm font-medium text-primary">${itemData.price}</p>}
              {itemData?.requirementDetails && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{itemData.requirementDetails}</p>
              )}
            </div>

            {seller && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-1">{getRecipientTitle()}</h4>
                <p className="text-sm text-muted-foreground">{seller.name || seller.email || "Unknown user"}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitInquiry} disabled={isSubmitting || !message.trim()}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {isProductInquiry ? "Send Inquiry" : "Send Proposal"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
