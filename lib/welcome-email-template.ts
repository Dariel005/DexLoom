import { resolveAbsoluteUrl } from "@/lib/site-url";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildWelcomeEmail(input: {
  trainerName: string;
}) {
  const trainerName = escapeHtml(input.trainerName.trim() || "DexLoom Trainer");
  const lucarioImageUrl = escapeHtml(resolveAbsoluteUrl("/images/email/lucario-verifier.png"));
  const pokeballImageUrl = escapeHtml(resolveAbsoluteUrl("/assets/pokemon-go/items/poke-ball.png"));
  const homeUrl = escapeHtml(resolveAbsoluteUrl("/"));
  const toolsUrl = escapeHtml(resolveAbsoluteUrl("/tools"));
  const socialUrl = escapeHtml(resolveAbsoluteUrl("/social"));
  const favoritesUrl = escapeHtml(resolveAbsoluteUrl("/favorites"));

  const subject = "DexLoom League Notice | Trainer Registration Confirmed";
  const text = [
    `DexLoom League Notice for ${input.trainerName.trim() || "Trainer"}`,
    ``,
    `Your trainer registration has been received and your DexLoom access has been formally opened.`,
    `We are building DexLoom as a growing League archive for the Pokemon community, with constant refinement so each trainer can explore, plan, and collect knowledge with more clarity and style.`,
    ``,
    `Your League roadmap is now available:`,
    `- Enter the Pokedex dossier to review species records, stats, typings, evolutions, and battle-ready detail in a cleaner format.`,
    `- Proceed to the archive and inspect moves, abilities, items, games, regions, locations, mechanics, mega evolutions, maps, Pokemon GO, cards, characters, and more.`,
    `- Establish your trainer record with favorites, your public profile, and social features that make your account feel personal and recognizable.`,
    `- Access the tools command hub, where filters, comparator, team builder, move planner, and audio controls support deeper preparation.`,
    ``,
    `Thank you for joining at this stage. DexLoom is still evolving, and every trainer who enters now becomes part of the journey of shaping a better archive for a remarkable Pokemon community.`,
    ``,
    `Primary access point: ${homeUrl}`,
    `Tools command hub: ${toolsUrl}`,
    `Favorites record: ${favoritesUrl}`,
    `Social station: ${socialUrl}`
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f1f2;font-family:Arial,sans-serif;color:#12203a;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f1f2;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="680" style="width:100%;max-width:680px;background:#fbfbfc;border:1px solid #d9dde6;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:22px 28px;border-bottom:1px solid #e4e7ee;text-align:center;">
                <div style="font-size:18px;font-weight:800;color:#1b2842;">DexLoom League Office</div>
              </td>
            </tr>
            <tr>
              <td style="padding:38px 28px 30px;">
                <div style="text-align:center;max-width:580px;margin:0 auto 24px;">
                  <h1 style="margin:0 0 14px;font-size:40px;line-height:1.08;font-weight:900;color:#0f2146;">Trainer Registration Confirmed</h1>
                  <p style="margin:0;font-size:18px;line-height:1.7;color:#4f617d;">
                    Greetings, ${trainerName}. Your DexLoom access has been formally opened. We are building this project as a growing League archive for the Pokemon community, refining it step by step so each trainer can explore with greater clarity, depth, and purpose.
                  </p>
                </div>

                <div style="margin:0 auto 24px;max-width:580px;border-radius:24px;overflow:hidden;box-shadow:0 18px 36px rgba(17,24,39,0.18);background:linear-gradient(135deg,#ef2525 0%,#9d0d19 52%,#4f0c18 100%);">
                  <div style="position:relative;padding:24px 26px 28px;height:212px;background:
                    radial-gradient(circle at 24% 18%,rgba(255,255,255,0.12),transparent 24%),
                    linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.16));">
                    <img src="${pokeballImageUrl}" alt="" width="420" height="420" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-47%);display:block;width:420px;height:420px;opacity:0.22;" />
                    <div style="position:absolute;left:-14px;top:-50px;width:286px;height:286px;border:18px solid rgba(255,255,255,0.08);border-radius:999px;"></div>
                    <div style="position:absolute;right:-58px;top:-28px;width:240px;height:240px;border:16px solid rgba(255,255,255,0.06);border-radius:999px;"></div>
                    <div style="position:absolute;left:0;right:0;top:50%;margin-top:-10px;height:20px;background:rgba(64,10,18,0.42);"></div>
                    <div style="position:absolute;left:50%;top:50%;width:122px;height:122px;margin-left:-61px;margin-top:-61px;border-radius:999px;border:14px solid rgba(91,18,26,0.46);background:rgba(255,255,255,0.08);"></div>
                    <div style="position:absolute;left:50%;top:50%;width:72px;height:72px;margin-left:-36px;margin-top:-36px;border-radius:999px;border:10px solid rgba(119,28,36,0.26);background:rgba(255,255,255,0.10);"></div>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" height="100%" style="position:relative;">
                      <tr>
                        <td valign="top">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td>
                                <span style="display:inline-block;border:1px solid rgba(255,255,255,0.32);background:rgba(255,255,255,0.10);padding:10px 14px;border-radius:12px;color:#fff;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">League Access: Granted</span>
                              </td>
                              <td align="right">
                                <span style="display:inline-block;background:#ffb400;color:#4e1900;padding:10px 14px;border-radius:10px;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Record Active</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td valign="bottom" style="padding-top:78px;">
                          <div style="font-size:14px;color:rgba(255,255,255,0.80);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Official Trainer Briefing</div>
                          <div style="margin-top:10px;font-size:34px;line-height:1.1;font-weight:900;color:#fff;">Your League Roadmap Is Ready</div>
                          <div style="margin-top:8px;font-size:18px;line-height:1.4;font-weight:700;letter-spacing:0.08em;color:rgba(255,255,255,0.84);">Pokedex records, archive access, tools, trainer profile, and social stations</div>
                        </td>
                      </tr>
                    </table>
                  </div>
                </div>

                <div style="text-align:center;margin:0 auto 22px;">
                  <div style="display:inline-flex;align-items:center;justify-content:center;width:172px;height:172px;border-radius:999px;background:#f3f5f9;border:1px solid #e4e8ef;box-shadow:inset 0 1px 0 rgba(255,255,255,0.92);">
                    <div style="display:flex;align-items:center;justify-content:center;width:142px;height:142px;border-radius:999px;background:#eef2f7;box-shadow:inset 0 1px 0 rgba(255,255,255,0.96);">
                      <img src="${lucarioImageUrl}" alt="Lucario welcome guide" width="122" height="122" style="display:block;width:122px;height:122px;object-fit:contain;object-position:center;" />
                    </div>
                  </div>
                </div>

                <div style="margin:0 auto;max-width:580px;">
                  <div style="margin-bottom:14px;border:1px solid #e4e8ef;border-radius:18px;background:#ffffff;padding:16px 18px;">
                    <div style="font-size:15px;font-weight:800;color:#102246;">1. Enter the Pokedex dossier</div>
                    <div style="margin-top:6px;font-size:14px;line-height:1.7;color:#5b6880;">Review species records, stats, typings, evolutions, and battle-ready detail through a cleaner League-style presentation designed for easier reading.</div>
                  </div>
                  <div style="margin-bottom:14px;border:1px solid #e4e8ef;border-radius:18px;background:#ffffff;padding:16px 18px;">
                    <div style="font-size:15px;font-weight:800;color:#102246;">2. Proceed to the League archive</div>
                    <div style="margin-top:6px;font-size:14px;line-height:1.7;color:#5b6880;">Move beyond the central dex and inspect abilities, moves, items, games, regions, locations, mechanics, mega evolutions, maps, Pokemon GO, cards, characters, and more in one connected archive.</div>
                  </div>
                  <div style="margin-bottom:14px;border:1px solid #e4e8ef;border-radius:18px;background:#ffffff;padding:16px 18px;">
                    <div style="font-size:15px;font-weight:800;color:#102246;">3. Establish your trainer record</div>
                    <div style="margin-top:6px;font-size:14px;line-height:1.7;color:#5b6880;">Set your favorites, shape your public profile, and use the social features to give your trainer identity a clear and personal record.</div>
                  </div>
                  <div style="margin-bottom:14px;border:1px solid #e4e8ef;border-radius:18px;background:#ffffff;padding:16px 18px;">
                    <div style="font-size:15px;font-weight:800;color:#102246;">4. Report to the command hub</div>
                    <div style="margin-top:6px;font-size:14px;line-height:1.7;color:#5b6880;">Use the tools hub to compare, filter, build teams, plan moves, and prepare with more purpose than simple browsing allows.</div>
                  </div>
                </div>

                <div style="text-align:center;margin-top:28px;">
                  <a href="${homeUrl}" style="display:inline-block;background:#ff2026;color:#ffffff;text-decoration:none;padding:18px 34px;border-radius:16px;font-size:22px;font-weight:900;letter-spacing:0.04em;box-shadow:0 10px 22px rgba(255,32,38,0.28);">
                    ENTER THE LEAGUE
                  </a>
                </div>

                <p style="margin:18px auto 0;max-width:520px;text-align:center;font-size:14px;line-height:1.8;color:#97a3b8;">
                  Thank you for joining at this stage. DexLoom is still growing, and every trainer who enters now becomes part of the effort to build a stronger archive for one of the most remarkable communities in gaming.
                </p>

                <p style="margin:22px 0 0;font-size:13px;line-height:1.8;color:#7b8598;text-align:center;">
                  Quick links:
                  <a href="${toolsUrl}" style="color:#d62828;text-decoration:none;margin:0 8px;">Tools Hub</a>
                  &bull;
                  <a href="${favoritesUrl}" style="color:#d62828;text-decoration:none;margin:0 8px;">Favorites</a>
                  &bull;
                  <a href="${socialUrl}" style="color:#d62828;text-decoration:none;margin:0 8px;">Social</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;background:#f4f6fa;border-top:1px solid #e4e7ee;text-align:center;">
                <div style="font-size:13px;line-height:1.7;color:#8d97ab;">
                  DexLoom League Office<br />
                  Welcome to the registry.
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
