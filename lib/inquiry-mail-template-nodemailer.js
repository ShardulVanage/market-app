import nodemailer from "nodemailer"

// Create transporter for Gmail
export const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
    },
  })
}

// Email templates
export const getAdminEmailTemplate = (inquiryData, inquiryType, itemData, buyerInfo, sellerInfo) => {
  const isProductInquiry = inquiryType === "product"
  const subject = `New ${isProductInquiry ? "Product Inquiry" : "Requirement Proposal"} - Approval Required`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
        New ${isProductInquiry ? "Product Inquiry" : "Requirement Proposal"}
      </h2>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #007bff; margin-top: 0;">Inquiry Details</h3>
        <p><strong>Type:</strong> ${isProductInquiry ? "Product Inquiry" : "Requirement Proposal"}</p>
        <p><strong>Item:</strong> ${itemData?.title || itemData?.quoteFor || "N/A"}</p>
        ${itemData?.price ? `<p><strong>Price:</strong> $${itemData.price}</p>` : ""}
        <p><strong>Message:</strong></p>
        <div style="background-color: white; padding: 10px; border-left: 3px solid #007bff; margin: 10px 0;">
          ${inquiryData.message}
        </div>
      </div>

      <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #28a745; margin-top: 0;">${isProductInquiry ? "Buyer" : "Seller"} Information</h3>
        <p><strong>Name:</strong> ${buyerInfo?.name || "N/A"}</p>
        <p><strong>Email:</strong> ${buyerInfo?.email || "N/A"}</p>
      </div>

      <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #dc3545; margin-top: 0;">${isProductInquiry ? "Seller" : "Buyer"} Information</h3>
        <p><strong>Name:</strong> ${sellerInfo?.name || "N/A"}</p>
        <p><strong>Email:</strong> ${sellerInfo?.email || "N/A"}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_ADMIN_PANEL_URL}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Go to Admin Panel
        </a>
      </div>

      <div style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 30px; color: #6c757d; font-size: 12px;">
        <p>This inquiry requires your approval before the parties can start chatting.</p>
        <p>Please review and approve/reject this inquiry from the admin panel.</p>
      </div>
    </div>
  `

  return { subject, html }
}

export const getUserEmailTemplate = (inquiryData, inquiryType, itemData, isForSeller = false) => {
  const isProductInquiry = inquiryType === "product"

  let subject, greeting, actionText

  if (isForSeller) {
    subject = `New ${isProductInquiry ? "Inquiry" : "Proposal"} for Your ${isProductInquiry ? "Product" : "Requirement"}`
    greeting = isProductInquiry
      ? "You have received a new inquiry for your product!"
      : "You have received a new proposal for your requirement!"
    actionText = "Someone is interested in"
  } else {
    subject = `${isProductInquiry ? "Inquiry" : "Proposal"} Submitted Successfully`
    greeting = `Your ${isProductInquiry ? "inquiry" : "proposal"} has been submitted successfully!`
    actionText = `You have submitted ${isProductInquiry ? "an inquiry for" : "a proposal for"}`
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">
        ${greeting}
      </h2>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #007bff; margin-top: 0;">${isProductInquiry ? "Product" : "Requirement"} Details</h3>
        <p><strong>Item:</strong> ${itemData?.title || itemData?.quoteFor || "N/A"}</p>
        ${itemData?.price ? `<p><strong>Price:</strong> $${itemData.price}</p>` : ""}
        <p><strong>Your Message:</strong></p>
        <div style="background-color: white; padding: 10px; border-left: 3px solid #28a745; margin: 10px 0;">
          ${inquiryData.message}
        </div>
      </div>

      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-top: 0;">What's Next?</h3>
        <p style="color: #856404; margin-bottom: 0;">
          Your ${isProductInquiry ? "inquiry" : "proposal"} is currently under review by our admin team. 
          You'll receive a notification once it's approved and you can start chatting with the ${isProductInquiry ? "seller" : "buyer"}.
        </p>
      </div>

      <div style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 30px; color: #6c757d; font-size: 12px;">
        <p>Thank you for using our platform!</p>
        <p>If you have any questions, please contact our support team.</p>
      </div>
    </div>
  `

  return { subject, html }
}
