import nodemailer from "nodemailer"

export async function POST(request) {
  try {
    const { companyData, userEmail, isUpdate } = await request.json()

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    const adminPanelUrl = `${process.env.NEXT_PUBLIC_ADMIN_PANEL_URL}`

    // Email to Admin
    const adminMailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `${isUpdate ? "Company Updated" : "New Company Registration"} - Approval Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Company ${isUpdate ? "Update" : "Registration"} Notification</h2>
          <p>A company profile has been ${isUpdate ? "updated" : "created"} and requires your approval.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Company Details:</h3>
            <p><strong>Company Name:</strong> ${companyData.companyName}</p>
            <p><strong>Address:</strong> ${companyData.companyAddress}</p>
            <p><strong>Description:</strong> ${companyData.companyDescription}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${adminPanelUrl}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Review in Admin Panel
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Please review and approve this company registration from your admin dashboard.</p>
        </div>
      `,
    }

    // Email to User
    // const userMailOptions = {
    //   from: process.env.GMAIL_USER,
    //   to: userEmail,
    //   subject: "Company Profile Created Successfully",
    //   html: `
    //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    //       <h2 style="color: #28a745;">Company Profile ${isUpdate ? "Updated" : "Created"} Successfully!</h2>
          
    //       <p>Dear ${companyData.companyName} Team,</p>
          
    //       <p>Your company profile has been ${isUpdate ? "updated" : "created"} successfully and is now under review.</p>
          
    //       <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
    //         <h3 style="margin-top: 0; color: #28a745;">What's Next?</h3>
    //         <ul style="margin: 10px 0;">
    //           <li>Our admin team will review your company details</li>
    //           <li>The review process typically takes up to 24 hours</li>
    //           <li>You'll receive an email notification once approved</li>
    //           <li>After approval, your company will be visible on our platform</li>
    //         </ul>
    //       </div>
          
    //       <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
    //         <h4 style="margin-top: 0;">Submitted Details:</h4>
    //         <p><strong>Company Name:</strong> ${companyData.companyName}</p>
    //         <p><strong>Email:</strong> ${companyData.companyEmail}</p>
    //         <p><strong>Phone:</strong> ${companyData.companyPhone}</p>
    //       </div>
          
    //       <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
    //       <p style="color: #666; font-size: 14px; margin-top: 30px;">
    //         Thank you for choosing our platform!<br>
    //         Best regards,<br>
    //         The Admin Team
    //       </p>
    //     </div>
    //   `,
    // }

    // Send both emails
    await Promise.all([transporter.sendMail(adminMailOptions)])

    return Response.json({ success: true, message: "Emails sent successfully" })
  } catch (error) {
    console.error("Email sending failed:", error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
