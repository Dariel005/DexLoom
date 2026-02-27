import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;

function readPort(value: string) {
  const port = Number(value);
  if (!Number.isFinite(port) || port <= 0) {
    return 587;
  }
  return Math.floor(port);
}

function isSecurePort(port: number) {
  return port === 465;
}

export function isSmtpEmailConfigured() {
  const host = String(process.env.SMTP_HOST ?? "").trim();
  const from = String(process.env.SMTP_FROM ?? "").trim();
  return host.length > 0 && from.length > 0;
}

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = String(process.env.SMTP_HOST ?? "").trim();
  const from = String(process.env.SMTP_FROM ?? "").trim();
  if (!host || !from) {
    throw new Error(
      "SMTP email delivery is not configured. Set SMTP_HOST and SMTP_FROM before sending mail."
    );
  }

  const port = readPort(String(process.env.SMTP_PORT ?? ""));
  const user = String(process.env.SMTP_USER ?? "").trim();
  const pass = String(process.env.SMTP_PASS ?? "").trim();
  const secureOverride = String(process.env.SMTP_SECURE ?? "").trim().toLowerCase();

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure:
      secureOverride === "1" || secureOverride === "true"
        ? true
        : secureOverride === "0" || secureOverride === "false"
          ? false
          : isSecurePort(port),
    auth: user ? { user, pass } : undefined
  });

  return cachedTransporter;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const transporter = getTransporter();
  const from = String(process.env.SMTP_FROM ?? "").trim();
  const replyTo = String(process.env.SMTP_REPLY_TO ?? "").trim();

  await transporter.sendMail({
    from,
    to: input.to,
    replyTo: replyTo || undefined,
    subject: input.subject,
    html: input.html,
    text: input.text
  });
}
