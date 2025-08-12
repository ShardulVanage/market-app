//for now not use

"use client"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import LoadingSpinner from "@/components/ui/loading-spinner"
import { getClientPb } from "@/lib/pocketbase"
import { MessageSquare } from "lucide-react"

export default function InquiryForm({ productId, requirementId, sellerId, onSuccess }) {
  const { currentUser } = useAuth()
  const pb = getClientPb()

  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!currentUser?.id || !message.trim()) return

    if (currentUser.profileStatus !== "approved") {
      alert("Your profile must be approved to send inquiries")
      return
    }

    setIsSubmitting(true)

    try {
      const inquiryData = {
        buyer: currentUser.id,
        seller: sellerId,
        message: message.trim(),
        status: "sent",
        approvalStatus: "pending",
      }

      if (productId) {
        inquiryData.product = productId
      }

      if (requirementId) {
        inquiryData.requirement = requirementId
      }

      await pb.collection("inquiries").create(inquiryData)

      alert("Inquiry sent successfully!")
      setMessage("")
      onSuccess?.()
    } catch (error) {
      console.error("Failed to send inquiry:", error)
      alert("Failed to send inquiry. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentUser || currentUser.userRole !== "buyer") {
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="inquiry-message">Send Inquiry</Label>
        <Textarea
          id="inquiry-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your inquiry message..."
          rows={4}
          required
        />
      </div>

      <Button type="submit" disabled={isSubmitting || !message.trim()} className="w-full">
        {isSubmitting ? (
          <>
            <LoadingSpinner size={16} className="mr-2" />
            Sending...
          </>
        ) : (
          <>
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Inquiry
          </>
        )}
      </Button>
    </form>
  )
}
