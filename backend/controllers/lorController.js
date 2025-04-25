// ============================================================
// FILE: backend/controllers/lorController.js
// ============================================================
const LORRequest = require('../models/LORRequest');
const User = require('../models/User'); // To find student details
const sendEmail = require('../utils/sendEmail'); // Email utility
const generateLORPDF = require('../utils/generateLORPDF'); // PDF generation utility
const path = require('path');
const fs = require('fs'); // To check/create directories if needed
const validator = require('validator'); // For email validation

// --- Student: Request an LOR ---
exports.requestLOR = async (req, res) => {
  try {
    const studentId = req.user.userId; // From protect middleware
    const studentEmail = req.user.email; // From protect middleware
    const { reason } = req.body;

    // --- Check for existing PENDING request ---
    // Find if this student already has a request with 'pending' status.
    const existingPendingRequest = await LORRequest.findOne({
      student: studentId,
      status: 'pending' // Specifically check for pending requests
    });

    // If a pending request exists, prevent creating a new one.
    if (existingPendingRequest) {
      console.warn(`Student ${studentEmail} attempted to create duplicate pending LOR request.`);
      // Return 409 Conflict status
      return res.status(409).json({ error: 'You already have a pending LOR request. Please wait for it to be processed.' });
    }
    // --- End Check ---

    // If no pending request, create the new one.
    const newRequest = new LORRequest({
      student: studentId,
      studentEmail: studentEmail,
      reason: reason || '', // Handle empty reason
      status: 'pending',
    });

    await newRequest.save();

    // Optional: Send notification email to admin about the new request
    // try {
    //   await sendEmail(process.env.ADMIN_EMAIL, `New LOR Request from ${studentEmail}`, `Student ${studentEmail} has submitted an LOR request. Reason: ${reason || 'N/A'}`);
    // } catch (emailError) {
    //   console.error("Failed to send admin notification email for new LOR request:", emailError);
    //   // Don't fail the whole request if notification fails, just log it.
    // }

    res.status(201).json({ message: 'LOR request submitted successfully.' });

  } catch (error) {
    console.error("❌ Error requesting LOR:", error);
    res.status(500).json({ error: 'Server error submitting LOR request.' });
  }
};

// --- Admin: Get All LOR Requests ---
exports.getAllLORRequests = async (req, res) => {
  try {
    // Fetch requests, populate student details (name)
    // Sort by status (pending first), then by date descending
    const requests = await LORRequest.find()
      .populate('student', 'name email') // Fetch name and email from User model
      .sort({ status: 1, requestDate: -1 }); // Sort pending first (ascending status), then by date descending

    res.json(requests);
  } catch (error) {
    console.error("❌ Error fetching LOR requests:", error);
    res.status(500).json({ error: 'Server error fetching LOR requests.' });
  }
};

// --- Admin: Update LOR Request Status (Approve/Reject) ---
exports.updateLORStatus = async (req, res) => {
  try {
    const { id } = req.params; // LOR Request ID
    const { status, adminNotes } = req.body; // 'approved' or 'rejected', optional notes
    const adminIssuer = req.user; // Get logged-in admin details from middleware

    // Validate input status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status provided.' });
    }

    // Find the request and populate student details
    const lorRequest = await LORRequest.findById(id).populate('student', 'name email');

    if (!lorRequest) {
      return res.status(404).json({ error: 'LOR Request not found.' });
    }

    // Prevent updating if not currently pending
    if (lorRequest.status !== 'pending') {
        return res.status(400).json({ error: `Request already ${lorRequest.status}. Cannot update.` });
    }

    // Update request fields
    lorRequest.status = status;
    lorRequest.adminNotes = adminNotes || lorRequest.adminNotes; // Keep existing notes if new ones aren't provided
    lorRequest.actionDate = new Date();
    let emailSubject = '';
    let emailHtml = '';
    let attachments = []; // Initialize attachments array

    if (status === 'approved') {
      // --- Generate LOR PDF ---
      const studentName = lorRequest.student?.name || 'Student'; // Use student name from populated data
      const studentEmail = lorRequest.student?.email; // Use student email
      const lorFilename = `LOR_${studentName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      const lorDir = path.join(__dirname, '../lors'); // Define LOR storage directory
      const lorFilePath = path.join(lorDir, lorFilename);

      // Ensure directory exists
      if (!fs.existsSync(lorDir)) {
        fs.mkdirSync(lorDir, { recursive: true });
      }

      // Prepare data for PDF generation, including admin details
      const pdfData = {
        name: studentName,
        email: studentEmail,
        date: new Date(),
        notes: adminNotes, // Pass admin notes to potentially include in PDF
        instructorName: adminIssuer?.name || '[Default Admin Name]', // Pass admin name
        // instructorTitle: adminIssuer?.title || '[Default Admin Title]', // Pass title if available in req.user
      };

      // Call the PDF generation utility
      await generateLORPDF(pdfData, lorFilePath);
      console.log(`✅ LOR PDF generated at: ${lorFilePath}`);

      lorRequest.lorPDFPath = `/lors/${lorFilename}`; // Store relative path (optional)
      // --- End PDF Generation ---

      // --- Prepare Email ---
      emailSubject = 'Your Letter of Recommendation Request has been Approved';
      emailHtml = `
        <p>Hello ${studentName},</p>
        <p>Your request for a Letter of Recommendation has been approved.</p>
        ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
        <p>Please find the LOR attached to this email.</p>
        <p>Regards,<br/>Admin Team</p>
      `;
      // Add the generated PDF as an attachment
      attachments.push({
        filename: lorFilename,
        path: lorFilePath,
        contentType: 'application/pdf'
      });
      // --- End Email Prep ---

    } else { // status === 'rejected'
      const studentName = lorRequest.student?.name || 'Student';
      emailSubject = 'Update on your Letter of Recommendation Request';
      emailHtml = `
        <p>Hello ${studentName},</p>
        <p>We regret to inform you that your request for a Letter of Recommendation has been rejected.</p>
        ${adminNotes ? `<p><strong>Reason/Notes:</strong> ${adminNotes}</p>` : ''}
        <p>Regards,<br/>Admin Team</p>
      `;
      // No attachments for rejection
    }

    // Save the updated request status and potentially the PDF path
    await lorRequest.save();

    // Send email notification to the student
    if (lorRequest.student?.email) { // Ensure student email exists before sending
        await sendEmail(lorRequest.student.email, emailSubject, emailHtml, attachments);
        console.log(`✅ Status update email sent to ${lorRequest.student.email} for LOR request ${id}`);
    } else {
        console.warn(`⚠️ Could not send status update email for LOR request ${id}: Student email not found.`);
    }


    res.json({ message: `LOR request ${status} successfully.` });

  } catch (error) {
    console.error(`❌ Error updating LOR status for request ${req.params.id}:`, error);
    // Handle potential PDF generation errors separately if needed
    res.status(500).json({ error: 'Server error updating LOR request status.' });
  }
};


// --- Admin: Issue LOR Directly (Without a Prior Request) ---
exports.issueDirectLOR = async (req, res) => {
    try {
        const { email, adminNotes } = req.body; // Get target email and optional notes
        const adminIssuer = req.user; // Get logged-in admin details

        // Validate email
        if (!email || typeof email !== 'string' || !validator.isEmail(email)) {
            return res.status(400).json({ error: 'Valid recipient email is required.' });
        }

        // Find the user to ensure they are registered and get their name
        const student = await User.findOne({ email: email.toLowerCase() });
        if (!student) {
            return res.status(404).json({ error: `No registered user found with email ${email}.` });
        }

        const studentName = student.name;
        const studentEmail = student.email;

        // --- Generate LOR PDF ---
        const lorFilename = `LOR_Direct_${studentName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        const lorDir = path.join(__dirname, '../lors'); // Define LOR storage directory
        const lorFilePath = path.join(lorDir, lorFilename);

        // Ensure directory exists
        if (!fs.existsSync(lorDir)) {
            fs.mkdirSync(lorDir, { recursive: true });
        }

        // Prepare data for PDF generation
        const pdfData = {
            name: studentName,
            email: studentEmail,
            date: new Date(),
            notes: adminNotes,
            instructorName: adminIssuer?.name || '[Default Admin Name]', // Pass admin name
            // instructorTitle: adminIssuer?.title || '[Default Admin Title]', // Pass title if available
        };

        // Call the PDF generation utility
        await generateLORPDF(pdfData, lorFilePath);
        console.log(`✅ Direct LOR PDF generated at: ${lorFilePath}`);
        // --- End PDF Generation ---

        // --- Prepare Email ---
        const emailSubject = 'Letter of Recommendation Issued';
        const emailHtml = `
            <p>Hello ${studentName},</p>
            <p>Please find a Letter of Recommendation issued for you attached to this email.</p>
            ${adminNotes ? `<p><strong>Notes:</strong> ${adminNotes}</p>` : ''}
            <p>Regards,<br/>Admin Team</p>
        `;
        const attachments = [{
            filename: lorFilename,
            path: lorFilePath,
            contentType: 'application/pdf'
        }];
        // --- End Email Prep ---

        // Optional: Create a record for tracking purposes
        const directLORRecord = new LORRequest({
            student: student._id,
            studentEmail: studentEmail,
            status: 'issued_directly', // Use the specific status
            actionDate: new Date(),
            adminNotes: `Directly issued. ${adminNotes || ''}`.trim(),
            lorPDFPath: `/lors/${lorFilename}` // Store relative path
        });
        await directLORRecord.save();
        // --- End Optional Record ---

        // Send email notification to the student
        await sendEmail(studentEmail, emailSubject, emailHtml, attachments);
        console.log(`✅ Directly issued LOR email sent to ${studentEmail}`);

        res.status(200).json({ message: `LOR issued directly and sent to ${studentEmail}.` });

    } catch (error) {
        console.error("❌ Error issuing direct LOR:", error);
        res.status(500).json({ error: 'Server error issuing direct LOR.' });
    }
};
