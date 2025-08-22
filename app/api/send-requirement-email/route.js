import nodemailer from "nodemailer"

export async function POST(request) {
  try {
    const { type, requirementData, userEmail, userName } = await request.json()

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    const adminPanelUrl = `${process.env.NEXT_PUBLIC_ADMIN_PANEL_URL}`
    const actionText = type === "create" ? "submitted" : "updated"
    const actionPastTense = type === "create" ? "created" : "updated"

    // Email to Admin
    const adminMailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: ` Requirement ${actionText} - ${requirementData.quoteFor}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Requirement ${actionText}</h2>
          <p>A requirement has been ${actionText} by <strong>${userName}</strong> (${userEmail})</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Requirement Details:</h3>
            <p><strong>Quote For:</strong> ${requirementData.quoteFor}</p>
            <p><strong>Category:</strong> ${requirementData.category}</p>
            <p><strong>Location:</strong> ${requirementData.location}</p>
            <p><strong>Details:</strong> ${requirementData.requirementDetails}</p>
            <p><strong>Status:</strong> Pending Approval</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${adminPanelUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Review in Admin Panel
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Please review and approve/reject this requirement from the admin dashboard.
          </p>
        </div>
      `,
    }

    // Email to User
    const userMailOptions = {
      from: process.env.GMAIL_USER,
      to: userEmail,
      subject: `Requirement ${actionPastTense} Successfully - ${requirementData.quoteFor}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Requirement ${actionPastTense} Successfully</h2>
          <p>Hello ${userName},</p>
          <p>Your requirement has been ${actionText} successfully and is now pending admin approval.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Requirement:</h3>
            <p><strong>Quote For:</strong> ${requirementData.quoteFor}</p>
            <p><strong>Category:</strong> ${requirementData.category}</p>
            <p><strong>Location:</strong> ${requirementData.location}</p>
            <p><strong>Status:</strong> Pending Approval</p>
          </div>
          
          <p>We will notify you once the admin reviews your requirement.</p>
          
          <p style="color: #666; font-size: 14px;">
            Thank you for using our platform!
          </p>
        </div>
      `,
    }

    // Send emails
    await Promise.all([transporter.sendMail(adminMailOptions), transporter.sendMail(userMailOptions)])

    return Response.json({ success: true, message: "Emails sent successfully" })
  } catch (error) {
    console.error("Email sending failed:", error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
