const nodemailer = require('nodemailer');
const { getMaxListeners } = require('pdfkit');

const sendEmail = async (to, subject, html, attachmentPath) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ajabishek001@gmail.com',
      pass: 'mcyd zxld tqxc qnko',
    },
  });

  const mailOptions = {
    from: `"CertifyMe" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments: [
      {
        filename: 'certificate.pdf',
        path: attachmentPath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
