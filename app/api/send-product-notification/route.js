import nodemailer from "nodemailer"

export async function POST(request) {
  try {
    const { productTitle, userEmail, userName, companyName, adminPanelUrl } = await request.json()

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    // Admin email
    const adminMailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Product Submission: ${productTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Product Submission</h2>
          <p>A new product has been submitted and requires your approval:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Product Details:</h3>
            <p><strong>Product Title:</strong> ${productTitle}</p>
           
            <p><strong>Seller:</strong> ${userName}</p>
            <p><strong>Seller Email:</strong> ${userEmail}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${adminPanelUrl || process.env.ADMIN_PANEL_URL}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Review in Admin Panel
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Please review and approve/reject this product submission.</p>
        </div>
      `,
    }

    // User email
    const userMailOptions = {
      from: process.env.GMAIL_USER,
      to: userEmail,
      subject: `Product Submission Confirmation - ${productTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Product Submitted Successfully!</h2>
          <p>Dear ${userName},</p>
          
          <p>Your product "<strong>${productTitle}</strong>" has been successfully submitted for review.</p>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #28a745;">What happens next?</h3>
            <ul style="margin: 10px 0;">
              <li>Our admin team will review your product within 24 hours</li>
              <li>You'll receive an email notification once the review is complete</li>
              <li>If approved, your product will be live on our platform</li>
            </ul>
          </div>
          
          <p>Thank you for choosing our platform to showcase your products!</p>
          
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please don't hesitate to contact our support team.
          </p>
        </div>
      `,
    }

    // Send both emails
    await Promise.all([transporter.sendMail(adminMailOptions), transporter.sendMail(userMailOptions)])

    return Response.json({ success: true, message: "Emails sent successfully" })
  } catch (error) {
    console.error("Error sending emails:", error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
