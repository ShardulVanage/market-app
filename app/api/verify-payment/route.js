import { NextResponse } from "next/server"
import crypto from "crypto"
import { getServerPb } from "@/lib/pocketbase"
import { cookies } from "next/headers"

export async function POST(request) {
  try {
    const body = await request.json()
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId, userId, planId } = body

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 })
    }

    // Initialize PocketBase with server context
    const cookieStore = cookies()
    const pb = getServerPb(cookieStore)

    // Calculate expiry date based on plan
    const planDurations = {
      basic: 30, // 1 month
      premium: 90, // 3 months
      enterprise: 180, // 6 months
    }

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + (planDurations[planId] || 30))

    await pb.collection("membership_orders").update(orderId, {
      status: "completed",
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      completedAt: new Date().toISOString(),
    })

    // Update user membership status
    await pb.collection("users").update(userId, {
      membershipStatus: "active",
      membershipPlan: planId,
      membershipExpiry: expiryDate.toISOString(),
    })

    return NextResponse.json({
      success: true,
      expiryDate: expiryDate.toISOString(),
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 })
  }
}
