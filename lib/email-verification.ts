import { createEmailVerificationToken, buildEmailVerificationUrl } from "@/lib/email-verification-token";
import { buildVerificationEmail } from "@/lib/email-verification-template";
import { isSmtpEmailConfigured, sendEmail } from "@/lib/email-service";
import { type StoredUser } from "@/lib/user-store";

export function canSendVerificationEmails() {
  return isSmtpEmailConfigured();
}

export async function sendVerificationEmail(user: StoredUser) {
  const token = createEmailVerificationToken({
    userId: user.id,
    email: user.email
  });
  const verifyUrl = buildEmailVerificationUrl(token);
  const email = buildVerificationEmail({
    trainerName: user.name,
    userId: user.id,
    verifyUrl
  });

  await sendEmail({
    to: user.email,
    subject: email.subject,
    html: email.html,
    text: email.text
  });

  return verifyUrl;
}
