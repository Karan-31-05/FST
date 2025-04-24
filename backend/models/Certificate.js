const mongoose = require('mongoose');

const certSchema = new mongoose.Schema({
  name: String,
  email: String,
  certificateId: { type: String, unique: true },
  issueDate: Date,
  verified: Boolean
});

module.exports = mongoose.model('Certificate', certSchema);
