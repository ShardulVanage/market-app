import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { userDetails } = await request.json();

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Profile Update Notification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #29688A; border-bottom: 2px solid #29688A; padding-bottom: 10px;">
              Profile Update Notification
            </h2>
            
            <p>A user has updated their profile and is awaiting approval.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #29688A;">User Details:</h3>
              <p><strong>Name:</strong> ${userDetails.prefix} ${userDetails.firstName} ${userDetails.lastName}</p>
              <p><strong>Email:</strong> ${userDetails.email}</p>
              <p><strong>Organization:</strong> ${userDetails.organizationName}</p>
              <p><strong>Designation:</strong> ${userDetails.designation}</p>
              <p><strong>Country:</strong> ${userDetails.country}</p>
              <p><strong>Mobile:</strong> ${userDetails.mobile}</p>
              <p><strong>LinkedIn:</strong> ${userDetails.linkedin}</p>
              <p><strong>Sectors of Interest:</strong> ${userDetails.sectorsOfInterest}</p>
              <p><strong>Functional Areas:</strong> ${userDetails.functionalAreas}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.ADMIN_PANEL_URL}" 
                 style="background-color: #29688A; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;
                        font-weight: bold;">
                Review in Admin Panel
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Please review and approve/reject this profile update from the admin dashboard.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `Profile Update - ${userDetails.firstName} ${userDetails.lastName}`,
      html: emailHtml,
    });

    return Response.json({ success: true, message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Email sending failed:', error);
    return Response.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}