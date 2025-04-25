// backend/models/LORRequest.js
const mongoose = require('mongoose');

const LORRequestSchema = new mongoose.Schema({
  // Reference to the student who requested the LOR
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming your User model is named 'User'
    required: true,
  },
  // Store student email for easier querying/display, though redundant if populated
  studentEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  // Optional reason provided by the student
  reason: {
    type: String,
    trim: true,
  },
  // Status of the request
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'issued_directly'], // Added issued_directly
    default: 'pending',
  },
  // Date the request was made
  requestDate: {
    type: Date,
    default: Date.now,
  },
  // Date the request was actioned (approved/rejected)
  actionDate: {
    type: Date,
  },
  // Optional notes added by the admin during review or direct issue
  adminNotes: {
    type: String,
    trim: true,
  },
  // Path to the generated LOR PDF file (if approved/issued)
  lorPDFPath: {
    type: String,
  },
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

module.exports = mongoose.model('LORRequest', LORRequestSchema);
