// backend/routes/certRoutes.js
const express = require('express');
const router = express.Router();

const {
  issueCertificate,
  getAllCerts,
  verifyCert,
  downloadCertificate
} = require('../controllers/certController');

const protect = require('../middleware/auth');
const { getMyCertificates } = require('../controllers/certController');


router.get('/my-certificates', protect, getMyCertificates);

// Public route: verify certificate by ID and download certificate by ID
router.get('/verify/:id', verifyCert);
router.get('/download/:id', downloadCertificate);

// Protected routes
router.get('/', protect, getAllCerts);
router.post('/issue', protect, issueCertificate);

module.exports = router;
