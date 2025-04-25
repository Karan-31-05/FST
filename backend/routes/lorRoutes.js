// backend/routes/lorRoutes.js
const express = require('express');
const router = express.Router();
const {
    requestLOR,
    getAllLORRequests,
    updateLORStatus,
    issueDirectLOR
} = require('../controllers/lorController');
const protect = require('../middleware/auth'); // Your JWT authentication middleware
const adminOnly = require('../middleware/admin'); // Your admin authorization middleware

// --- Student Routes ---
// POST /api/lor/request - Student requests an LOR
router.post('/request', protect, requestLOR);

// --- Admin Routes ---
// GET /api/lor/requests - Admin gets all requests
router.get('/requests', protect, adminOnly, getAllLORRequests);

// PUT /api/lor/requests/:id/status - Admin approves or rejects a request
router.put('/requests/:id/status', protect, adminOnly, updateLORStatus);

// POST /api/lor/issue-direct - Admin issues an LOR directly to a student email
router.post('/issue-direct', protect, adminOnly, issueDirectLOR);


module.exports = router;
