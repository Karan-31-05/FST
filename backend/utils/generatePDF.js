// backend/utils/generatePDF.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Updated function: single-page, logo in header, signature image above line
const generatePDF = (certificate, qrCodeDataUrl, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 40
      });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // --- Define Paths and Check Existence ---
      const logoPath = path.join(__dirname, '../assets/images/anna_university_logo.png'); // Path to AU logo
      const signatureImagePath = path.join(__dirname, '../assets/images/signature.png'); // Path to signature image

      const logoExists = fs.existsSync(logoPath);
      const signatureExists = fs.existsSync(signatureImagePath);

      if (!logoExists) {
        console.warn(`⚠️ Anna University logo file not found at: ${logoPath}. Proceeding without logo.`);
      }
      if (!signatureExists) {
        console.warn(`⚠️ Signature image file not found at: ${signatureImagePath}. Proceeding without signature image.`);
      }
      // ---------------------------------------

      // --- Define Variables ---
      const institutionName = process.env.INSTITUTION_NAME || "CEG, ANNA UNIVERSITY";
      const departmentName = process.env.DEPARTMENT_NAME || "Computer Science and Engineering";
      const pageHeight = doc.page.height;
      const pageWidth = doc.page.width;
      const margin = doc.page.margins.left;
      const availableHeight = pageHeight - 2 * margin;
      const availableWidth = pageWidth - 2 * margin;
      // ------------------------

      // --- Certificate Styling ---

      // Border
      doc.lineWidth(1.5).rect(margin, margin, availableWidth, availableHeight).strokeColor('#cccccc').stroke();

      // --- Header Section with Logo ---
      const headerStartY = margin + 10;
      const logoSize = 35;
      const logoX = margin;
      const logoY = headerStartY;

      if (logoExists) {
          try {
              doc.image(logoPath, logoX, logoY, { fit: [logoSize, logoSize] });
          } catch (logoErr) {
              console.error(`Error embedding AU logo (${logoPath}): ${logoErr.message}.`);
              doc.fontSize(8).text('[Logo Err]', logoX, logoY + logoSize/2, {width: logoSize, align:'center'});
          }
      } else {
          doc.fontSize(8).text('[No Logo]', logoX, logoY + logoSize/2, {width: logoSize, align:'center'});
      }

      const headerTextX = logoX + logoSize + 10;
      const headerTextWidth = availableWidth - logoSize - 10;

      doc.fontSize(14).font('Helvetica-Bold').text(institutionName, headerTextX, headerStartY + 3, { width: headerTextWidth, align: 'left' });
      doc.fontSize(12).font('Helvetica').text(`Department of ${departmentName}`, headerTextX, doc.y, { width: headerTextWidth, align: 'left' });

      const headerEndY = Math.max(logoY + logoSize, doc.y);
      doc.y = headerEndY;
      doc.moveDown(2);
      // --- End Header Section ---


      // Title
      doc.fontSize(30).font('Helvetica-Bold').text('Certificate of Completion', { align: 'center' });
      doc.moveDown(1);

      // Subtitle
      doc.fontSize(16).font('Helvetica').text('This certifies that', { align: 'center' });
      doc.moveDown(1);

      // Student Name
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#003366')
        .text(certificate.name || '[Student Name]', { align: 'center' });
      doc.fillColor('#000000'); // Reset color
      doc.moveDown(1);

      // Completion Text
      doc.fontSize(16).font('Helvetica').text('has successfully completed the', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(18).font('Helvetica-Bold').text('FULL STACK TECHNOLOGIES', { align: 'center' });
      doc.fontSize(16).font('Helvetica').text('program.', { align: 'center' });
      doc.moveDown(1.5);

      // --- Calculate remaining height ---
      const currentY = doc.y;
      const bottomElementStartY = pageHeight - margin - 110; // Reserve slightly more space at bottom for signature image
      const spaceForDetails = bottomElementStartY - currentY;

      // --- Details Section ---
      let detailsY = currentY + Math.max(10, spaceForDetails / 4);
      const detailsX = margin + 20;
      const detailsLabelWidth = 100;
      const detailsValueX = detailsX + detailsLabelWidth;
      const detailsValueWidth = 200;

      doc.fontSize(11).font('Helvetica-Bold').text('Issue Date:', detailsX, detailsY, { width: detailsLabelWidth });
      doc.font('Helvetica').text(new Date(certificate.issueDate).toLocaleDateString(), detailsValueX, detailsY, { width: detailsValueWidth });
      detailsY += 18;

      doc.font('Helvetica-Bold').text('Certificate ID:', detailsX, detailsY, { width: detailsLabelWidth });
      doc.font('Helvetica').text(certificate.certificateId || '[ID]', detailsValueX, detailsY, { width: detailsValueWidth });
      // --- End Details Section ---


      // --- Position Bottom Elements ---
      const bottomY = pageHeight - margin - 85; // Baseline Y for bottom elements
      const qrSize = 70;
      const qrX = pageWidth - margin - qrSize; // QR on the right
      const qrY = bottomY;

      const signatureX = margin + 20; // Signature on the left
      const signatureLineWidth = 200;
      const signatureTextY = bottomY + qrSize + 4; // Y position for the text below the line (aligned with QR bottom text)
      const signatureLineY = signatureTextY - 6; // Position line slightly above text baseline
      const signatureImageHeight = 40; // Max height for signature image
      const signatureImageWidth = signatureLineWidth * 0.8; // Max width relative to line
      const signatureImageY = signatureLineY - signatureImageHeight - 2; // Position image above line
      const signatureImageX = signatureX + (signatureLineWidth - signatureImageWidth) / 2; // Center image horizontally over line


      // --- QR Code ---
      if (qrCodeDataUrl) {
        try {
          doc.image(qrCodeDataUrl, qrX, qrY, { fit: [qrSize, qrSize] });
          doc.fontSize(7).text('Scan to verify', qrX, qrY + qrSize + 3, { width: qrSize, align: 'center' });
        } catch (imgError) {
          console.error("Error embedding QR code in PDF:", imgError);
          doc.fontSize(8).text('[QR Err]', qrX, qrY + qrSize / 2, { width: qrSize, align: 'center' });
        }
      } else {
        doc.fontSize(8).text('[No QR]', qrX, qrY + qrSize / 2, { width: qrSize, align: 'center' });
      }
      // --- End QR Code ---

      // --- Signature Block ---
      // Place Signature Image (if exists)
      if (signatureExists) {
         try {
            doc.image(signatureImagePath, signatureImageX, signatureImageY, {
                 fit: [signatureImageWidth, signatureImageHeight], // Fit within bounds
                 align: 'center'
             });
         } catch(sigErr) {
             console.error(`Error embedding signature image (${signatureImagePath}): ${sigErr.message}.`);
             // Optional: Add placeholder text if image fails
             doc.fontSize(8).text('[Signature Image Error]', signatureImageX, signatureImageY + signatureImageHeight/2);
         }
      }

      // Draw signature line
      doc.lineWidth(0.8).moveTo(signatureX, signatureLineY).lineTo(signatureX + signatureLineWidth, signatureLineY).strokeColor('#333333').stroke();
      // Place text below line
      doc.fontSize(9).text('Authorized Signature', signatureX, signatureTextY, { width: signatureLineWidth, align: 'center' });

      // REMOVED Green Tick logic
      // --- End Signature Block ---


      // Finalize the PDF
      doc.end();

      stream.on('finish', () => {
        console.log(`✅ Certificate PDF generated successfully at ${outputPath}`);
        resolve(outputPath);
      });
      stream.on('error', (err) => {
        console.error(`❌ Error writing PDF stream for ${outputPath}:`, err);
        reject(err);
      });

    } catch (error) {
      console.error(`❌ Error generating Certificate PDF for ${outputPath}:`, error);
      reject(error);
    }
  });
};

module.exports = generatePDF;
