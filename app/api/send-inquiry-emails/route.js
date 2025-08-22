import { NextResponse } from "next/server"
import { createTransporter, getAdminEmailTemplate, getUserEmailTemplate } from "@/lib/inquiry-mail-template-nodemailer"

export async function POST(request) {
  try {
    const { inquiryData, inquiryType, itemData, buyerInfo, sellerInfo } = await request.json()

    // Validate required data
    if (!inquiryData || !inquiryType || !itemData || !buyerInfo || !sellerInfo) {
      return NextResponse.json({ error: "Missing required data for sending emails" }, { status: 400 })
    }

    const transporter = createTransporter()

    // Prepare emails
    const emails = []

    // 1. Email to Admin
    const adminEmail = getAdminEmailTemplate(inquiryData, inquiryType, itemData, buyerInfo, sellerInfo)
    emails.push({
      from: process.env.GMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: adminEmail.subject,
      html: adminEmail.html,
    })

    // 2. Email to Buyer (person who submitted the inquiry/proposal)
    const buyerEmail = getUserEmailTemplate(inquiryData, inquiryType, itemData, false)
    emails.push({
      from: process.env.GMAIL_USER,
      to: buyerInfo.email,
      subject: buyerEmail.subject,
      html: buyerEmail.html,
    })

    // 3. Email to Seller (person who will receive the inquiry/proposal)
    const sellerEmail = getUserEmailTemplate(inquiryData, inquiryType, itemData, true)
    emails.push({
      from: process.env.GMAIL_USER,
      to: sellerInfo.email,
      subject: sellerEmail.subject,
      html: sellerEmail.html,
    })

    // Send all emails
    const emailPromises = emails.map((email) => transporter.sendMail(email))
    await Promise.all(emailPromises)

    return NextResponse.json({
      success: true,
      message: "All notification emails sent successfully",
    })
  } catch (error) {
    console.error("Error sending inquiry emails:", error)
    return NextResponse.json({ error: "Failed to send notification emails", details: error.message }, { status: 500 })
  }
}
