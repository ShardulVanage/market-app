"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Star, Zap } from "lucide-react"
import LoadingSpinner from "@/components/ui/loading-spinner"

const MEMBERSHIP_PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 999,
    duration: "1 Month",
    icon: Star,
    features: ["List up to 10 products", "Basic analytics", "Email support", "Standard listing visibility"],
    popular: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: 2499,
    duration: "3 Months",
    icon: Crown,
    features: [
      "List up to 50 products",
      "Advanced analytics",
      "Priority support",
      "Enhanced listing visibility",
      "Featured product placement",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 4999,
    duration: "6 Months",
    icon: Zap,
    features: [
      "Unlimited products",
      "Premium analytics dashboard",
      "24/7 phone support",
      "Top listing priority",
      "Custom branding options",
      "Dedicated account manager",
    ],
    popular: false,
  },
]

export default function MembershipDialog({ open, onOpenChange }) {
  const { currentUser, pb } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  const handlePlanSelect = async (plan) => {
    if (isProcessing) return

    setIsProcessing(true)
    setSelectedPlan(plan.id)

    try {
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          userId: currentUser.id,
        }),
      })

      const orderResult = await orderResponse.json()

      if (!orderResult.success) {
        throw new Error(orderResult.error || "Failed to create order")
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderResult.amount,
        currency: orderResult.currency,
        name: "Marketplace Membership",
        description: `${plan.name} Plan - ${plan.duration}`,
        order_id: orderResult.razorpayOrderId, // Use Razorpay order ID
        handler: async (response) => {
          try {
            // Verify payment and update membership
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderResult.orderId, // Our internal order ID
                userId: currentUser.id,
                planId: plan.id,
              }),
            })

            const result = await verifyResponse.json()

            if (result.success) {
              // Update user membership status
              await pb.collection("users").update(currentUser.id, {
                membershipStatus: "active",
                membershipPlan: plan.id,
                membershipExpiry: result.expiryDate,
              })

              alert("Payment successful! Your membership is now active.")
              onOpenChange(false)
              window.location.reload() // Refresh to show updated status
            } else {
              throw new Error(result.error || "Payment verification failed")
            }
          } catch (error) {
            console.error("Payment verification error:", error)
            alert("Payment verification failed. Please contact support.")
          }
        },
        prefill: {
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          email: currentUser.email,
          contact: currentUser.mobile || "",
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
            setSelectedPlan(null)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Failed to initiate payment. Please try again.")
      setIsProcessing(false)
      setSelectedPlan(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Choose Your Membership Plan</DialogTitle>
          <DialogDescription className="text-center">
            Unlock premium features and grow your business with our membership plans
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6">
          {MEMBERSHIP_PLANS.map((plan) => {
            const Icon = plan.icon
            const isSelected = selectedPlan === plan.id
            const isLoading = isProcessing && isSelected

            return (
              <Card
                key={plan.id}
                className={`relative transition-all duration-200 ${
                  plan.popular ? "border-blue-500 shadow-lg scale-105" : "border-gray-200 hover:border-gray-300"
                } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${plan.popular ? "bg-blue-100" : "bg-gray-100"}`}>
                      <Icon className={`w-8 h-8 ${plan.popular ? "text-blue-600" : "text-gray-600"}`} />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">₹{plan.price.toLocaleString()}</span>
                    <span className="text-gray-600 ml-2">/ {plan.duration}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePlanSelect(plan)}
                    disabled={isProcessing}
                    className={`w-full ${
                      plan.popular ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-900 hover:bg-gray-800"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Processing...
                      </>
                    ) : (
                      `Choose ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>All plans include secure payment processing and instant activation.</p>
          <p>Need help choosing? Contact our support team.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
