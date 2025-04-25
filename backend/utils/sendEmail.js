// backend/utils/sendEmail.js
require('dotenv').config();
const nodemailer = require('nodemailer');
// const { getMaxListeners } = require('pdfkit'); // Unused import - removed

// Updated function signature to accept an array of attachments
const sendEmail = async (to, subject, html, attachmentsArray = []) => {
  // --- Security Warning: Move credentials to .env file! ---
  // Example: process.env.EMAIL_USER and process.env.EMAIL_PASS
  const emailUser = 'ajabishek001@gmail.com'; // Use env var primarily
  const emailPass = 'mcyd zxld tqxc qnko'; // Use env var! DO NOT HARDCODE PASSWORD!

  if (!emailUser || !emailPass) {
      console.error("❌ Email credentials (EMAIL_USER, EMAIL_PASS) not found in environment variables.");
      // Throw an error or return early to prevent Nodemailer from failing later
      throw new Error("Email service configuration is incomplete.");
  }
  // ---------------------------------------------------------

  const transporter = nodemailer.createTransport({
    service: 'gmail', // Ensure Gmail settings allow less secure apps or use App Passwords correctly
    auth: {
      user: emailUser,
      pass: emailPass, // Use variable from environment
    },
  });

  const mailOptions = {
    from: `"CertifyMe" <${emailUser}>`, // Use configured user email
    to, // Recipient email address
    subject, // Email subject
    html, // Email body (HTML content)
    attachments: attachmentsArray, // <-- Use the attachments array directly passed as argument
    // Nodemailer correctly handles an array of attachment objects like:
    // [
    //   { filename: 'lor.pdf', path: '/path/to/lor.pdf', contentType: 'application/pdf' },
    //   { filename: 'another.txt', content: 'File content as string' }
    // ]
  };

  try {
    // Attempt to send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}: ${info.messageId}`);
    return info; // Return info object on success
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}. Subject: "${subject}". Error:`, error);
    // Re-throw the error or handle it as needed by the calling function
    throw error;
  }
};

module.exports = sendEmail;
