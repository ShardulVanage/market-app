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



export function InquiryDialog({ product, seller, trigger }) {
  const { currentUser, pb } = useAuth()
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showProfilePendingPrompt, setShowProfilePendingPrompt] = useState(false)

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
    router.push("/login") // Adjust this path to your login page
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
    setIsSubmitting(true)
    try {
      const inquiryData = {
        buyer: currentUser.id,
        seller: seller.id,
        product: product.id,
        message: message.trim(),
        approvalStatus: "pending",
        status: "sent",
        chat: [],
      }
      const result = await pb.collection("inquiries").create(inquiryData)
      toast({
        title: "Inquiry Sent Successfully",
        description: "Your inquiry has been sent to the seller. You'll be notified once it's approved.",
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

  const defaultTrigger = (
    <Button size="lg" className="flex-1" onClick={handleTriggerClick}>
      <MessageSquare className="h-5 w-5 mr-2" />
      Contact Seller
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
              You need to be logged in to send an inquiry to the seller. Would you like to log in now?
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
              can send inquiries to sellers. Please wait for admin approval or contact support if you have questions.
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
            <DialogTitle>Send Inquiry to Seller</DialogTitle>
            <DialogDescription>
              Send a message to the seller about "{product?.title}". Your inquiry will be reviewed before you can start
              chatting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inquiry-message">Your Message</Label>
              <Textarea
                id="inquiry-message"
                placeholder="Hi, I'm interested in this product. Could you please provide more details about..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">{message.length}/500 characters</p>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Product Details</h4>
              <p className="text-sm text-muted-foreground">{product?.title}</p>
              <p className="text-sm font-medium text-primary">${product?.price}</p>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Seller Information</h4>
              <p className="text-sm text-muted-foreground">{seller?.name}</p>
            </div>
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
                  Send Inquiry
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
