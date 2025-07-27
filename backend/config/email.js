const nodemailer = require('nodemailer');

// Create Gmail transporter
const createTransporter = () => {
  console.log('📧 Creating email transporter with:');
  console.log('- Gmail User:', process.env.GMAIL_USER);
  console.log('- App Password:', process.env.GMAIL_APP_PASSWORD ? 'Set (length: ' + process.env.GMAIL_APP_PASSWORD.length + ')' : 'NOT SET');
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Gmail credentials not properly configured in .env file');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true, // Enable debug mode
    logger: true // Enable logging
  });
};

// Send verification email to admin
const sendVerificationEmail = async (userDetails, filePath, fileName) => {
  try {
    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: {
        name: 'Alumni Verification System',
        address: process.env.GMAIL_USER
      },
      to: process.env.ADMIN_EMAIL,
      subject: `🎓 Alumni Verification Request - ${userDetails.name || 'Unknown User'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #2563eb; margin: 0;">🎓 Alumni Verification Request</h2>
            <p style="color: #666; margin: 5px 0;">New verification document submitted</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin-top: 0;">User Information:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Name:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${userDetails.name || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${userDetails.email || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>User ID:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${userDetails.userId || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Submission Date:</strong></td>
                <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;">
              <strong>📎 Document Attached:</strong> ${fileName}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <h3 style="color: #1e40af;">Action Required:</h3>
            <p style="color: #666; margin-bottom: 20px;">Please review the attached document and respond with your decision.</p>
            
            <div style="margin: 20px 0;">
              <a href="mailto:${userDetails.email}?subject=Alumni%20Verification%20APPROVED&body=Dear%20${userDetails.name || 'Alumni'},%0D%0A%0D%0ACongratulations!%20Your%20alumni%20verification%20has%20been%20APPROVED.%0D%0A%0D%0AYou%20can%20now%20access%20all%20alumni%20features.%0D%0A%0D%0ABest%20regards,%0D%0AAlumni%20Verification%20Team" 
                 style="display: inline-block; padding: 12px 24px; margin: 0 10px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                ✅ APPROVE
              </a>
              
              <a href="mailto:${userDetails.email}?subject=Alumni%20Verification%20REJECTED&body=Dear%20${userDetails.name || 'User'},%0D%0A%0D%0AWe%20regret%20to%20inform%20you%20that%20your%20alumni%20verification%20has%20been%20REJECTED.%0D%0A%0D%0AReason:%20[Please%20specify%20reason]%0D%0A%0D%0AYou%20may%20submit%20a%20new%20verification%20request%20with%20proper%20documentation.%0D%0A%0D%0ABest%20regards,%0D%0AAlumni%20Verification%20Team" 
                 style="display: inline-block; padding: 12px 24px; margin: 0 10px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                ❌ REJECT
              </a>
            </div>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated email from the Alumni Verification System.</p>
            <p>Please do not reply to this email address.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          path: filePath,
          contentType: 'application/octet-stream'
        }
      ]
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    console.log('🔍 Testing email configuration...');
    
    // Check if environment variables are set
    if (!process.env.GMAIL_USER) {
      throw new Error('GMAIL_USER not set in .env file');
    }
    if (!process.env.GMAIL_APP_PASSWORD) {
      throw new Error('GMAIL_APP_PASSWORD not set in .env file');
    }
    
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Gmail SMTP configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Gmail SMTP configuration error:');
    console.error('Error message:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  testEmailConfig
};