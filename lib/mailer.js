import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || "587", 10),
    secure: SMTP_PORT === "465",
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) throw new Error("SMTP not configured");
  return t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "Saayo <no-reply@saayo.example>",
    to,
    subject,
    text,
    html,
  });
}

export async function sendPasswordResetEmail(email, token) {
  const base = process.env.APP_URL || "http://localhost:3000";
  const link = `${base}/reset-password?token=${encodeURIComponent(token)}`;
  return sendMail({
    to: email,
    subject: "Reset your Saayo password",
    text: `Click the link to reset your password: ${link}`,
    html: `<p>Click the button below to reset your Saayo password:</p><a href="${link}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Reset password</a><p>Link expires in 15 minutes. Ignore this email if you didn't request a reset.</p>`,
  });
}

export async function sendOrderNotification(email, orderNumber, status) {
  if (!email) return;
  return sendMail({
    to: email,
    subject: `Saayo order ${orderNumber} is ${status}`,
    text: `Your order ${orderNumber} is now ${status}.`,
  });
}

export async function sendNewsletterConfirmation(email, name = "") {
  return sendMail({
    to: email,
    subject: "Welcome to the Saayo newsletter",
    text: `Thanks for subscribing${name ? `, ${name}` : ""}! You'll hear about 3D drops and offers soon.`,
  });
}