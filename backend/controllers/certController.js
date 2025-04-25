// ============================================================
// FILE: backend/controllers/certController.js
// ============================================================

const Certificate = require('../models/Certificate');
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Or 'bcrypt', ensure consistency
const path = require('path');
const fs = require('fs');
const validator = require('validator');
const generatePDF = require('../utils/generatePDF'); // PDF generator utility
const generateQRCode = require('../utils/generateQRCode'); // QR generator utility
const sendEmail = require('../utils/sendEmail'); // Email utility

// --- Issue Certificate ---
exports.issueCertificate = async (req, res) => {
  // BACKEND VALIDATION
  const { name, email } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Student Name is required.' });
  }
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ error: 'Student Email is required.' });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  // END VALIDATION

  try {
    // Check for existing certificate
    const existingCert = await Certificate.findOne({ email });
    if (existingCert) {
      console.warn(`Attempt to issue duplicate certificate for email: ${email}.`);
      return res.status(409).json({ error: 'This mail has already received certificate.' });
    }

    // Create certificate details
    const certificateId = `CERT-${Date.now()}`;
    const issueDate = new Date();

    // Save certificate record to DB
    const cert = new Certificate({ name, email, certificateId, issueDate, verified: true });
    await cert.save();
    console.log(`✅ Certificate ${certificateId} saved for ${email}`);

    // Create user if not exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('123', 10); // Still insecure password
      const newUser = new User({ name, email, password: hashedPassword, role: 'student' });
      await newUser.save();
      console.log(`✅ Student account created for ${email}`);
    } else {
      console.log(`ℹ️ Student account already exists for ${email}`);
    }

    // Generate QR Code Data URL FIRST
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify/${certificateId}`;
    const qrDataUrl = await generateQRCode(verificationUrl);
    console.log(`✅ QR Code generated for ${certificateId}`);

    // Generate PDF, passing QR data
    const certDir = path.join(__dirname, '../certs');
    const filePath = path.join(certDir, `${certificateId}.pdf`);
    if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
    }
    await generatePDF(cert, qrDataUrl, filePath); // Pass cert data, QR data, path

    // Send Email (WITHOUT QR code in HTML)
    const emailSubject = `Your Certificate Issued: ${certificateId}`;
    const html = `
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your certificate for the <strong>FULL STACK TECHNOLOGIES</strong> program has been issued.</p>
      <p>Please find your certificate attached to this email.</p>
      <p>Certificate ID: ${certificateId}</p>
      <p>You can also verify your certificate online using the ID or the QR code embedded in the PDF.</p>
      <hr>
      <p>A student account may have been created or already existed for your email (${email}).</p>
      <p>If a new account was created, the default password is '123'. Please change it upon first login at: <a href="${frontendUrl}/login?role=student">Student Login</a></p>
      <p>Regards,<br/>CertifyMe Team</p>
    `;
    const attachments = [{
        filename: `Certificate_${name.replace(/\s+/g, '_')}_${certificateId}.pdf`,
        path: filePath,
        contentType: 'application/pdf'
    }];
    await sendEmail(email, emailSubject, html, attachments);

    res.status(201).json({
        message: "Certificate issued successfully and sent via email.",
        certificateId
    });

  } catch (error) {
    console.error("❌ Error in issueCertificate:", error);
    res.status(500).json({ error: error.message || "Server error issuing certificate. Please check logs." });
  }
};

// --- Get All Certificates (Admin) --- RESTORED ---
exports.getAllCerts = async (req, res) => {
  console.log("--> getAllCerts function started"); // Added log
  try {
    console.log("--> Querying Certificate.find()..."); // Added log
    const certs = await Certificate.find().sort({ issueDate: -1 }); // Fetch all, sort by newest first
    console.log(`--> Found ${certs ? certs.length : 'null'} certificates.`); // Added log
    console.log("--> Sending response..."); // Added log
    res.json(certs); // Send the array of certificates
    console.log("--> Response sent."); // Added log
  } catch (error) {
    console.error("❌ Error in getAllCerts:", error); // Log the specific error
    res.status(500).json({ error: 'Server error fetching certificates' }); // Send generic error response
  }
};

// --- Verify Certificate (Public) --- RESTORED ---
exports.verifyCert = async (req, res) => {
  console.log(`--> verifyCert started for ID: ${req.params.id}`); // Added log
  try {
    const certificateId = req.params.id; // Get ID from URL parameter
    console.log(`--> Querying Certificate.findOne for ID: ${certificateId}`); // Added log
    const cert = await Certificate.findOne({ certificateId: certificateId }); // Find by certificateId field

    if (!cert) {
      console.log(`--> Certificate not found for ID: ${certificateId}`); // Added log
      // If no certificate found, return 404
      return res.status(404).json({ error: 'Certificate not found' });
    }

    console.log(`--> Certificate found for ID: ${certificateId}. Sending response.`); // Added log
    // If found, return the certificate data
    res.json(cert);
    console.log("--> Response sent for verifyCert."); // Added log

  } catch (error) {
    console.error(`❌ Error verifying certificate ID ${req.params.id}:`, error); // Log the specific error
    res.status(500).json({ error: 'Server error verifying certificate' }); // Send generic error response
  }
};

// --- Download Certificate PDF --- RESTORED ---
exports.downloadCertificate = async (req, res) => {
  const certificateId = req.params.id;
  console.log(`--> downloadCertificate started for ID: ${certificateId}`); // Added log
  try {
    // Find the certificate record to ensure it exists (optional but good practice)
    const cert = await Certificate.findOne({ certificateId });
    if (!cert) {
      console.log(`--> Certificate record not found for download: ${certificateId}`);
      return res.status(404).json({ error: 'Certificate record not found.' });
    }

    // Construct the file path
    let filePath = path.join(__dirname, `../certs/${certificateId}.pdf`);
    console.log("--> Attempting to download file from path:", filePath);

    // Check if the file exists, regenerate if needed (and possible)
    // Note: Regenerating here requires QR data again, which we don't have easily.
    // It's better to ensure PDF exists after issuance or handle missing file gracefully.
    if (!fs.existsSync(filePath)) {
      console.warn(`--> PDF file not found at path: ${filePath}. Cannot download.`);
      // Option 1: Return 404
      return res.status(404).json({ error: 'Certificate PDF file not found. It might need to be regenerated.' });
      // Option 2: Try to regenerate (more complex, needs QR data)
      // console.log(`--> File does not exist, attempting regeneration: ${filePath}`);
      // const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      // const verificationUrl = `${frontendUrl}/verify/${certificateId}`;
      // const qrDataUrl = await generateQRCode(verificationUrl); // Regenerate QR
      // await generatePDF(cert, qrDataUrl, filePath); // Regenerate PDF
      // console.log(`--> Successfully regenerated: ${filePath}`);
    }

    // Use res.download to send the file
    // It handles setting appropriate headers (Content-Disposition, Content-Type)
    res.download(filePath, `Certificate_${cert.name.replace(/\s+/g, '_')}_${certificateId}.pdf`, (err) => {
      // This callback handles errors *after* headers may have been sent
      if (err) {
        console.error(`❌ Download error for ${certificateId} after starting send:`, err);
        // Check if headers were already sent, if not, send a server error status
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error preparing certificate for download.' });
        }
        // If headers were sent, the connection might just close, error logged on server.
      } else {
        console.log(`--> Successfully initiated download for ${certificateId}`);
      }
    });

  } catch (error) {
    console.error(`❌ Server error during download process for ${certificateId}:`, error);
    // Ensure response is sent if headers haven't been
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error downloading certificate.' });
    }
  }
};

// --- Get Certificates for Logged-in Student --- RESTORED ---
exports.getMyCertificates = async (req, res) => {
  // Assumes 'protect' middleware ran and attached user info to req.user
  const userEmail = req.user?.email;
  console.log(`--> getMyCertificates started for user: ${userEmail}`); // Added log

  if (!userEmail) {
    console.warn("--> User email not found in request token for getMyCertificates.");
    return res.status(401).json({ error: 'Authentication error: User email not found.' });
  }

  try {
    console.log(`--> Querying Certificate.find for email: ${userEmail}`); // Added log
    // Find certificates matching the email from the authenticated user's token
    const certs = await Certificate.find({ email: userEmail }).sort({ issueDate: -1 });
    console.log(`--> Found ${certs ? certs.length : 'null'} certificates for ${userEmail}.`); // Added log

    console.log("--> Sending response for getMyCertificates..."); // Added log
    res.json(certs); // Send the array (even if empty)
    console.log("--> Response sent for getMyCertificates."); // Added log

  } catch (error) {
    console.error(`❌ Error fetching certificates for student ${userEmail}:`, error); // Log the specific error
    res.status(500).json({ error: 'Server error fetching your certificates.' }); // Send generic error response
  }
};
