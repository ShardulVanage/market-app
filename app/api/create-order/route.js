import { NextResponse } from "next/server"
import Razorpay from "razorpay"
import { getServerPb } from "@/lib/pocketbase"
import { cookies } from "next/headers"

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export async function POST(request) {
  try {
    const body = await request.json()
    const { planId, planName, amount, userId } = body

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        planId,
        planName,
        userId,
      },
    })

    // Initialize PocketBase with server context
    const cookieStore = cookies()
    const pb = getServerPb(cookieStore)

    // Create order record in PocketBase
    const orderData = {
      user: userId,
      planId,
      planName,
      amount,
      currency: "INR",
      status: "pending",
      razorpayOrderId: razorpayOrder.id,
    }

    const order = await pb.collection("membership_orders").create(orderData)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ success: false, error: "Failed to create order" }, { status: 500 })
  }
}
