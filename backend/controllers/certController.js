
const Certificate = require('../models/Certificate');
const generatePDF = require('../utils/generatePDF');
const generateQRCode = require('../utils/generateQRCode');
const sendEmail = require('../utils/sendEmail');
const path = require('path');
const fs = require('fs'); // Import the fs module
const User = require('../models/User');
const bcrypt = require('bcrypt');
const validator = require('validator');

exports.issueCertificate = async (req, res) => {

  // Validate email format
  const { name, email } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Student Name is required.' });
  }
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ error: 'Student Email is required.' });
  }
  if (!validator.isEmail(email)) { // Using validator library for robust check
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  try {
    const existingCert = await Certificate.findOne({ email });

    if (existingCert) {
      // If a certificate exists for this email, return a 409 Conflict error
      console.warn(`Attempt to issue duplicate certificate for email: ${email}. Existing Cert ID: ${existingCert.certificateId}`);
      return res.status(409).json({
        error: 'This mail has already received certificate.', // Your requested message
        // You could include details of the existing certificate if needed by the frontend
        // existingCertificate: {
        //   name: existingCert.name,
        //   certificateId: existingCert.certificateId,
        //   issueDate: existingCert.issueDate,
        // }
      });
    }

    const certificateId = `CERT-${Date.now()}`;
    const issueDate = new Date();

    // ✅ Save certificate to DB
    const cert = new Certificate({
      name,
      email,
      certificateId,
      issueDate,
      verified: true,
    });
    await cert.save();
    console.log('✅ Certificate saved to database');

    // ✅ Automatically create student user if not exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('123', 10);
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role: 'student',
      });
      await newUser.save();
      console.log('✅ Student account created with default password');
    } else {
      console.log('ℹ️ Student already exists');
    }

    // ✅ Generate PDF
    const filePath = path.join(__dirname, `../certs/${certificateId}.pdf`);
    await generatePDF(cert, filePath);
    console.log('✅ PDF generated');

    // ✅ Generate QR code
    const qrData = await generateQRCode(`http://localhost:3000/verify/${certificateId}`);
    console.log('✅ QR Code generated');

    // ✅ Send email with certificate + login info
    const html = `
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your certificate has been issued. A student account has also been created for you.</p>
      <p>
        <strong>Login:</strong> ${email}<br/>
        <strong>Password:</strong> 123
      </p>
      <p>
        Please log in at: <a href="http://localhost:3000/login?role=student">Student Login</a>
      </p>
      <p>
        <img src="${qrData}" alt="QR Code"/>
      </p>
    `;
    await sendEmail(email, "Your Certificate & Login Access", html, filePath);
    console.log('✅ Email sent');

    res.json({ message: "Certificate issued and student account created", certificateId });
  } catch (error) {
    console.error("❌ Error in issueCertificate:", error);
    res.status(500).json({ error: "Error issuing certificate" });
  }
};

  
exports.getAllCerts = async (req, res) => {
  try { // Add try
    const certs = await Certificate.find();
    res.json(certs);
  } catch (error) { // Add catch
    console.error("Error fetching all certificates:", error);
    res.status(500).json({ error: 'Server error fetching certificates' });
  }
};
exports.verifyCert = async (req, res) => {
  try { // Add try
    const cert = await Certificate.findOne({ certificateId: req.params.id });
    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    res.json(cert);
  } catch (error) { // Add catch
    console.error("Error verifying certificate:", error);
    res.status(500).json({ error: 'Server error verifying certificate' });
  }
};

exports.downloadCertificate = async (req, res) => {
  try {
    const certificateId = req.params.id;
    console.log("downloadCertificate: certificateId =", certificateId);

    const cert = await Certificate.findOne({ certificateId });
    console.log("downloadCertificate: cert =", cert);

    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    let filePath = path.join(__dirname, `../certs/${certificateId}.pdf`);
    console.log("downloadCertificate: filePath =", filePath);

    // Check if the file exists, and regenerate if it doesn't
    if (!fs.existsSync(filePath)) {
      console.log(`File does not exist, regenerating: ${filePath}`);
      await generatePDF(cert, filePath);
      console.log(`Successfully regenerated: ${filePath}`);
    }

    res.download(filePath, `${certificateId}.pdf`, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Error downloading certificate' });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error downloading certificate' });
  }
};

exports.getMyCertificates = async (req, res) => {
  try {
    const email = req.user.email; // comes from decoded JWT
    const certs = await Certificate.find({ email });
    res.json(certs);
  } catch (error) {
    console.error('Error fetching student certificates:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
