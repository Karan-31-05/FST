
const Certificate = require('../models/Certificate');
const generatePDF = require('../utils/generatePDF');
const generateQRCode = require('../utils/generateQRCode');
const sendEmail = require('../utils/sendEmail');
const path = require('path');
const fs = require('fs'); // Import the fs module
const User = require('../models/User');
const bcrypt = require('bcrypt');

exports.issueCertificate = async (req, res) => {
  try {
    const { name, email } = req.body;
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
  const certs = await Certificate.find();
  res.json(certs);
};
exports.verifyCert = async (req, res) => {
    const cert = await Certificate.findOne({ certificateId: req.params.id });
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    res.json(cert);
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
