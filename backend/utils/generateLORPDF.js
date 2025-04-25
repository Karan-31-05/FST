// backend/utils/generateLORPDF.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path'); // Import path module

// Updated function to include a logo
async function generateLORPDF(data, outputPath) {
  // --- Use placeholders or passed data ---
  const studentName = data.name || '[Student Name]';
  const issueDate = data.date || new Date();
  const adminNotes = data.notes || '';
  const courseName = "FULL STACK TECHNOLOGIES"; // Specific course
  const instructorName = "Dr. P. Mohamed Fathimal"; // Get from config or admin profile
  const instructorTitle = data.instructorTitle || "Assistant Professor"; // Get from config or admin profile
  const institutionName = data.institutionName || "CEG,ANNA UNIVERSITY";
  const departmentName = data.departmentName || "Department of Computer Science and Engineering";
  const contactEmail = process.env.ADMIN_CONTACT_EMAIL || "fatnazir@annauniv.edu.com"; // Use a specific contact email

  // --- Define Path to Logo ---
  // Adjust the path based on your actual project structure
  const logoPath = path.join(__dirname, '../assets/images/anna_university_logo.png');
  const logoExists = fs.existsSync(logoPath);
  if (!logoExists) {
    console.warn(`⚠️ Logo file not found at: ${logoPath}. Proceeding without logo.`);
  }
  // -------------------------

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // --- LOR Content ---

      // 1. Letterhead with Logo
      const letterheadStartY = doc.y;
      const logoSize = 60; // Adjust size as needed
      const logoX = doc.page.margins.left;
      const logoY = letterheadStartY;

      // Text position relative to logo
      const textX = logoX + logoSize + 15; // Add some space between logo and text
      const textWidth = doc.page.width - doc.page.margins.right - textX;

      // Embed logo if it exists
      if (logoExists) {
        doc.image(logoPath, logoX, logoY, {
          fit: [logoSize, logoSize], // Maintain aspect ratio within bounds
          align: 'center',
          valign: 'top' // Align logo to the top of the line
        });
      } else {
        // If no logo, maybe add placeholder text or just start text at margin
        doc.fontSize(8).text('[Logo]', logoX, logoY + logoSize/3, {width: logoSize, align: 'center'});
      }

      // Institution and Department Name (next to logo)
      // Adjust font sizes and Y positions to align nicely with the logo height
      doc.fontSize(16).font('Helvetica-Bold').text(institutionName, textX, letterheadStartY + 5, { width: textWidth });
      doc.fontSize(12).font('Helvetica').text(departmentName, textX, doc.y, { width: textWidth }); // doc.y automatically uses position after previous line

      // Ensure content starts below the letterhead area
      const letterheadEndY = Math.max(logoY + logoSize, doc.y); // Find bottom edge of logo or text
      doc.y = letterheadEndY; // Set current Y position
      doc.moveDown(0.5);

      // Separator Line
      doc.lineWidth(0.5).moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown(2);


      // 2. Date
      doc.fontSize(11).font('Helvetica').text(`Date: ${issueDate.toLocaleDateString()}`, { align: 'right' });
      doc.moveDown(2);

      // 3. Recipient Address
      doc.text('To Whom It May Concern,');
      doc.moveDown();

      // 4. Subject Line
      doc.font('Helvetica-Bold').text(`Subject: Letter of Recommendation for ${studentName}`);
      doc.moveDown();

      // 5. Body Paragraph 1: Introduction
      doc.font('Helvetica').text(`It is with great pleasure that I recommend ${studentName}, who successfully completed the ${courseName} course under my instruction at ${institutionName}. I have had the opportunity to observe ${studentName}'s progress and abilities throughout the duration of the course.`, {
        lineGap: 4, align: 'justify'
      });
      doc.moveDown();

      // 6. Body Paragraph 2: Full Stack Skills & Performance
      doc.text(`${studentName} demonstrated a strong aptitude for both front-end and back-end development concepts covered in the ${courseName} program. This included proficiency in core technologies such as HTML, CSS, JavaScript, Node.js, React, Express, and database management with MongoDB.`, {
        lineGap: 4, align: 'justify'
      });
      doc.moveDown();

      // 7. Body Paragraph 3: Soft Skills / General Qualities
      doc.text(`Beyond technical skills, ${studentName} is a dedicated and proactive learner, consistently meeting deadlines and demonstrating a strong work ethic. They possess excellent communication skills and collaborated effectively with peers.`, {
        lineGap: 4, align: 'justify'
      });
      doc.moveDown();

      // 8. Admin Notes (If provided)
      if (adminNotes) {
        doc.font('Helvetica-Bold').text('Additional Notes:', { underline: true });
        doc.font('Helvetica').text(adminNotes, { lineGap: 4, align: 'justify' });
        doc.moveDown();
      }

      // 9. Concluding Paragraph
      doc.text(`Based on ${studentName}'s performance and potential demonstrated in the ${courseName} course, I recommend them highly for future opportunities in web development. I am confident they would be a valuable asset to any team.`, {
        lineGap: 4, align: 'justify'
      });
      doc.moveDown(2);

      // 10. Closing
      doc.text('Sincerely,');
      doc.moveDown(3); // Space for signature

      // 11. Signature Block
      doc.font('Helvetica-Bold').text(instructorName);
      doc.font('Helvetica').text(instructorTitle);
      doc.text(departmentName);
      doc.text(institutionName);
      doc.text(`Email: ${contactEmail}`);

      // --- End LOR Content ---

      doc.end();

      writeStream.on('finish', () => {
        console.log(`✅ LOR PDF with logo generated successfully at ${outputPath}`);
        resolve();
      });

      writeStream.on('error', (err) => {
        console.error(`❌ Error writing PDF stream for ${outputPath}:`, err);
        reject(err);
      });

    } catch (error) {
      console.error(`❌ Error generating LOR PDF for ${outputPath}:`, error);
      reject(error);
    }
  });
}

module.exports = generateLORPDF;
