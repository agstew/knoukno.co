const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendPasswordResetEmail(to, resetUrl) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set; skipping email send. Reset URL:', resetUrl);
    return;
  }
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Kno U Kno <onboarding@resend.dev>',
    to,
    subject: 'Reset your Kno U Kno password',
    html: `<p>You requested a password reset for your Kno U Kno account.</p>
<p><a href="${resetUrl}">Click here to reset your password</a> (expires in 1 hour).</p>
<p>If you didn't request this, you can safely ignore this email.</p>`
  });
}

module.exports = { sendPasswordResetEmail };
