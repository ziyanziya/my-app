const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;
if (config.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT || 587,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
  });
}

async function sendMail(to, subject, html) {
  if (!transporter) {
    console.log('[mail] transporter not configured. Skipping mail to', to, 'subject', subject);
    return;
  }
  await transporter.sendMail({ from: config.SMTP_USER, to, subject, html });
}

module.exports = { sendMail };
