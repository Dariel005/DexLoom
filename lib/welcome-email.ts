import { sendEmail } from "@/lib/email-service";
import { buildWelcomeEmail } from "@/lib/welcome-email-template";
import { type StoredUser } from "@/lib/user-store";

export async function sendWelcomeEmail(user: Pick<StoredUser, "email" | "name">) {
  const email = buildWelcomeEmail({
    trainerName: user.name
  });

  await sendEmail({
    to: user.email,
    subject: email.subject,
    html: email.html,
    text: email.text
  });
}
