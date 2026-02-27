import { resolveAbsoluteUrl } from "@/lib/site-url";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTrainerCode(userId: string) {
  const compact = userId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (compact.length < 12) {
    return `#${compact.padEnd(12, "X").slice(0, 4)}-${compact.padEnd(12, "X").slice(4, 8)}-${compact.padEnd(12, "X").slice(8, 12)}`;
  }
  return `#${compact.slice(0, 4)}-${compact.slice(4, 8)}-${compact.slice(8, 14)}`;
}

export function buildVerificationEmail(input: {
  trainerName: string;
  userId: string;
  verifyUrl: string;
}) {
  const trainerName = escapeHtml(input.trainerName.trim() || "DexLoom Trainer");
  const trainerCode = escapeHtml(buildTrainerCode(input.userId));
  const verifyUrl = escapeHtml(input.verifyUrl);
  const lucarioImageUrl = escapeHtml(resolveAbsoluteUrl("/images/email/lucario-verifier.png"));

  const subject = "Verify your DexLoom Trainer Card";
  const text = [
    `DexLoom Trainer Card Access`,
    ``,
    `Welcome to DexLoom. Verify your identity to activate your trainer account.`,
    `Trainer: ${input.trainerName.trim() || "DexLoom Trainer"}`,
    `Trainer ID: ${buildTrainerCode(input.userId)}`,
    ``,
    `Verify now: ${input.verifyUrl}`,
    ``,
    `If you did not create this account, you can ignore this email.`
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f1f2;font-family:Arial,sans-serif;color:#12203a;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f1f2;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="680" style="width:100%;max-width:680px;background:#fbfbfc;border:1px solid #d9dde6;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #e4e7ee;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="font-size:18px;font-weight:800;color:#1b2842;">DexLoom Data Entry</td>
                    <td align="right" style="font-size:14px;color:#6f7f98;">
                      Registration Progress
                      <span style="display:inline-block;margin-left:12px;color:#ff2b2b;font-weight:800;">Step 2 of 3</span>
                      <span style="display:inline-block;vertical-align:middle;margin-left:10px;width:96px;height:8px;background:#d8deea;border-radius:999px;overflow:hidden;">
                        <span style="display:block;width:67%;height:100%;background:#ff2b2b;"></span>
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 28px 28px;">
                <div style="text-align:center;max-width:560px;margin:0 auto 28px;">
                  <h1 style="margin:0 0 14px;font-size:42px;line-height:1.08;font-weight:900;color:#0f2146;">Trainer Card Access</h1>
                  <p style="margin:0;font-size:18px;line-height:1.7;color:#4f617d;">
                    Welcome to DexLoom. Please verify your identity below to activate your Pokedex, unlock your Trainer Card, and begin your journey.
                  </p>
                </div>

                <div style="margin:0 auto 28px;max-width:580px;border-radius:24px;overflow:hidden;box-shadow:0 18px 36px rgba(17,24,39,0.18);background:linear-gradient(135deg,#ef2525 0%,#a3121c 48%,#45111f 100%);">
                  <div style="padding:26px 30px 30px;background:
                    radial-gradient(circle at 30% 22%,rgba(255,255,255,0.10),transparent 26%),
                    radial-gradient(circle at 50% 44%,rgba(255,255,255,0.08),transparent 12%),
                    linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.12));">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td>
                          <span style="display:inline-block;border:1px solid rgba(255,255,255,0.24);background:rgba(255,255,255,0.12);padding:9px 12px;border-radius:12px;color:#fff;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Region: DexLoom</span>
                        </td>
                        <td align="right">
                          <span style="display:inline-block;background:#ff3e35;color:#fff;padding:10px 14px;border-radius:10px;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Unverified</span>
                        </td>
                      </tr>
                    </table>

                    <div style="padding:94px 0 8px;">
                      <div style="font-size:14px;color:rgba(255,255,255,0.76);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Trainer ID</div>
                      <div style="margin-top:10px;font-size:34px;line-height:1.1;font-weight:900;color:#fff;">${trainerName}</div>
                      <div style="margin-top:8px;font-size:18px;line-height:1.4;font-weight:700;letter-spacing:0.18em;color:rgba(255,255,255,0.84);">${trainerCode}</div>
                    </div>
                  </div>
                </div>

                <div style="text-align:center;margin:0 auto 26px;">
                  <div style="display:inline-flex;align-items:center;justify-content:center;width:148px;height:148px;border-radius:999px;background:#f3f5f9;border:1px solid #e4e8ef;box-shadow:inset 0 1px 0 rgba(255,255,255,0.92);">
                    <img src="${lucarioImageUrl}" alt="Lucario verification guide" width="96" height="96" style="display:block;width:96px;height:96px;object-fit:contain;" />
                  </div>
                </div>

                <div style="text-align:center;">
                  <a href="${verifyUrl}" style="display:inline-block;background:#ff2026;color:#ffffff;text-decoration:none;padding:18px 34px;border-radius:16px;font-size:22px;font-weight:900;letter-spacing:0.04em;box-shadow:0 10px 22px rgba(255,32,38,0.28);">
                    VERIFY TRAINER CARD
                  </a>
                </div>

                <p style="margin:18px auto 0;max-width:440px;text-align:center;font-size:14px;line-height:1.7;color:#97a3b8;">
                  By verifying, you confirm this email belongs to you and activate credentials access for your DexLoom account.
                </p>

                <p style="margin:26px 0 0;font-size:13px;line-height:1.7;color:#7b8598;text-align:center;">
                  If the button does not open, copy and paste this link into your browser:<br />
                  <a href="${verifyUrl}" style="color:#d62828;word-break:break-all;">${verifyUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;background:#f4f6fa;border-top:1px solid #e4e7ee;text-align:center;">
                <div style="font-size:13px;line-height:1.7;color:#8d97ab;">
                  DexLoom Trainer Systems<br />
                  If you did not create this account, you can ignore this email safely.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
