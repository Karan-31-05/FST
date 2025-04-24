// backend/utils/generatePDF.js
const PDFDocument = require('pdfkit');
const fs = require('fs');

const generatePDF = (certificate, path) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(path);
    doc.pipe(stream);

    doc.fontSize(24).text('Certificate of Completion', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text(`This is to certify that`);
    doc.moveDown();
    doc.fontSize(22).text(`${certificate.name}`, { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(16).text(`has successfully completed the program.`);
    doc.moveDown();
    doc.fontSize(14).text(`Certificate ID: ${certificate.certificateId}`);
    doc.fontSize(14).text(`Issue Date: ${new Date(certificate.issueDate).toDateString()}`);

    doc.end();

    stream.on('finish', () => resolve(path));
    stream.on('error', reject);
  });
};

module.exports = generatePDF;
