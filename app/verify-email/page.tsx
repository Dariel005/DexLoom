import Image from "next/image";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import { verifyEmailVerificationToken } from "@/lib/email-verification-token";
import { markUserEmailVerified } from "@/lib/user-store";
import { sendWelcomeEmail } from "@/lib/welcome-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VerifyEmailPageProps {
  searchParams?: {
    token?: string;
  };
}

type VerifyState = "verified" | "already_verified" | "expired" | "invalid" | "missing";

function resolveCopy(state: VerifyState) {
  switch (state) {
    case "verified":
      return {
        eyebrow: "Verification Complete",
        title: "Trainer Card Activated",
        description:
          "Your DexLoom email has been confirmed. Password access is now unlocked for your trainer account.",
        toneClass: "border-emerald-300/70 bg-emerald-50 text-emerald-800"
      };
    case "already_verified":
      return {
        eyebrow: "Already Active",
        title: "Trainer Card Already Verified",
        description:
          "This email link was already used. Your DexLoom trainer account is ready to sign in.",
        toneClass: "border-sky-300/70 bg-sky-50 text-sky-800"
      };
    case "expired":
      return {
        eyebrow: "Link Expired",
        title: "Verification Link Timed Out",
        description:
          "That verification link expired. Go back to register or login and request a new DexLoom confirmation email.",
        toneClass: "border-amber-300/70 bg-amber-50 text-amber-800"
      };
    case "invalid":
      return {
        eyebrow: "Invalid Link",
        title: "Verification Could Not Be Confirmed",
        description:
          "This verification link is not valid anymore. Request a new email and try again.",
        toneClass: "border-red-300/70 bg-red-50 text-red-800"
      };
    default:
      return {
        eyebrow: "Missing Token",
        title: "Verification Link Missing",
        description:
          "Open the verification link from your DexLoom email, or request a new one from the register or login screen.",
        toneClass: "border-red-300/70 bg-red-50 text-red-800"
      };
  }
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const token = String(searchParams?.token ?? "").trim();

  let state: VerifyState = "missing";

  if (token) {
    const verificationResult = verifyEmailVerificationToken(token);
    if (!verificationResult.ok) {
      state = verificationResult.reason === "expired" ? "expired" : "invalid";
    } else {
      const result = await markUserEmailVerified({
        userId: verificationResult.payload.uid,
        email: verificationResult.payload.email
      });
      if (result.status === "verified" && result.user) {
        try {
          await sendWelcomeEmail(result.user);
        } catch {
          // Verification should stay successful even if welcome mail fails.
        }
      }
      state =
        result.status === "verified"
          ? "verified"
          : result.status === "already_verified"
            ? "already_verified"
            : "invalid";
    }
  }

  const copy = resolveCopy(state);

  return (
    <main className="pokemon-detail-page auth-surface min-h-screen px-2 py-4 sm:px-4 sm:py-8">
      <section className="auth-route-surface route-transition-surface auth-shell-live mx-auto w-full max-w-[980px] rounded-[2.2rem] border-[3px] border-[#2d4b87] bg-[linear-gradient(180deg,#fdfdfd_0%,#f4f6fb_100%)] p-3 shadow-[0_24px_46px_rgba(0,0,0,0.24)]">
        <div className="overflow-hidden rounded-[1.8rem] border-2 border-[#c8ced9] bg-white">
          <header className="border-b-2 border-[#b92f35] bg-[radial-gradient(circle_at_12%_14%,rgba(255,255,255,0.24),transparent_34%),linear-gradient(145deg,#e14749,#b72128)] px-4 py-5 sm:px-6 sm:py-6">
            <h1 className="auth-title-live pixel-font text-center text-[22px] uppercase tracking-[0.08em] text-[#fff4f3] drop-shadow-[0_2px_0_#8d1d23] sm:text-[30px]">
              DexLoom
            </h1>
          </header>

          <div className="border-b border-black/10 bg-white px-4 py-3 sm:px-6">
            <div className="auth-chip-live mx-auto flex w-fit items-center gap-2 rounded-xl border border-[#a9262c] bg-[linear-gradient(160deg,#d84044,#b82127)] px-4 py-2 text-white shadow-[0_4px_10px_rgba(0,0,0,0.18)]">
              <span className="auth-chip-led h-2.5 w-2.5 rounded-full bg-[#ffeb82] shadow-[0_0_0_1px_rgba(0,0,0,0.24),0_0_10px_rgba(255,235,130,0.6)]" />
              <p className="pixel-font text-[10px] uppercase tracking-[0.14em] sm:text-[12px]">
                Trainer Verification
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="rounded-3xl border-2 border-[#a9262c] bg-[linear-gradient(160deg,#cb343a,#b5262d)] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] sm:p-7">
              <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-[#ffe870]">
                {copy.eyebrow}
              </p>
              <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <h2 className="pixel-font text-[14px] uppercase tracking-[0.08em] text-white sm:text-[17px]">
                    {copy.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-white/88 sm:text-base">
                    {copy.description}
                  </p>
                  <div className={`mt-4 inline-flex rounded-xl border px-3 py-2 text-xs font-semibold ${copy.toneClass}`}>
                    {state === "verified" || state === "already_verified"
                      ? "Password login ready"
                      : "Verification required"}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <RouteTransitionLink
                      href="/login"
                      exitDurationMs={240}
                      className="auth-action-btn-live pixel-font rounded-xl border border-black/30 bg-[#f5f7fa] px-5 py-3 text-[11px] uppercase tracking-[0.12em] text-[#a5282e] shadow-[0_4px_0_rgba(0,0,0,0.18)] transition hover:brightness-105"
                    >
                      Go To Login
                    </RouteTransitionLink>
                    <RouteTransitionLink
                      href="/register"
                      exitDurationMs={240}
                      className="auth-action-btn-live pixel-font rounded-xl border border-black/30 bg-[#f5f7fa] px-5 py-3 text-[11px] uppercase tracking-[0.12em] text-[#a5282e] shadow-[0_4px_0_rgba(0,0,0,0.18)] transition hover:brightness-105"
                    >
                      Request New Email
                    </RouteTransitionLink>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex h-[190px] w-[190px] items-center justify-center rounded-full border border-white/30 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]">
                    <Image
                      src="/images/email/lucario-verifier.png"
                      alt="Lucario"
                      width={150}
                      height={150}
                      className="h-[150px] w-[150px] object-contain drop-shadow-[0_14px_18px_rgba(0,0,0,0.26)]"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
