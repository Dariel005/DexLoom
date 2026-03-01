"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { type ClientSafeProvider, getProviders, signIn } from "next-auth/react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => searchParams.get("callbackUrl") || "/",
    [searchParams]
  );
  const authError = searchParams.get("error");
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [providersLoadError, setProvidersLoadError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingCredentials, setPendingCredentials] = useState(false);
  const [pendingGoogle, setPendingGoogle] = useState(false);
  const [pendingResend, setPendingResend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendInfo, setResendInfo] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    void getProviders()
      .then((resolvedProviders) => {
        setProviders(resolvedProviders);
        setProvidersLoaded(true);
      })
      .catch(() => {
        setProvidersLoadError("Could not load authentication providers.");
        setProvidersLoaded(true);
      });
  }, []);

  const handleCredentialLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPendingCredentials(true);
    setError(null);
    setResendInfo(null);
    setUnverifiedEmail(null);

    const preflightResponse = await fetch("/api/auth/login/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const preflightPayload = (await preflightResponse.json().catch(() => null)) as {
      message?: string;
      code?: string;
    } | null;

    if (!preflightResponse.ok) {
      setPendingCredentials(false);
      setError(preflightPayload?.message ?? "Invalid email or password.");
      if (preflightPayload?.code === "EMAIL_UNVERIFIED") {
        setUnverifiedEmail(email);
      }
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false
    });

    setPendingCredentials(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(result?.url ?? callbackUrl);
    router.refresh();
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) {
      return;
    }

    setPendingResend(true);
    setError(null);
    setResendInfo(null);

    const response = await fetch("/api/auth/verify-email/resend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: unverifiedEmail })
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    setPendingResend(false);

    if (!response.ok) {
      setError(payload?.message ?? "Unable to send a new verification email.");
      return;
    }

    setResendInfo(payload?.message ?? "A new verification email is on the way.");
  };

  const googleEnabled = Boolean(providersLoaded && providers?.google);
  const showGoogleConfigHint = providersLoaded && !providersLoadError && !googleEnabled;

  return (
    <main className="auth-mobile-page pokemon-detail-page auth-surface min-h-screen px-2 py-4 sm:px-4 sm:py-8">
      <section className="auth-mobile-shell auth-route-surface route-transition-surface auth-shell-live mx-auto w-full max-w-[980px] rounded-[2.2rem] border-[3px] border-[#2d4b87] bg-[linear-gradient(180deg,#fdfdfd_0%,#f4f6fb_100%)] p-3 shadow-[0_24px_46px_rgba(0,0,0,0.24)]">
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
                Trainer Access
              </p>
            </div>
            <div className="mt-3 flex justify-center">
              <RouteTransitionLink
                href="/"
                exitDurationMs={240}
                className="auth-home-btn-live pixel-font inline-flex items-center gap-2 rounded-xl border border-[#2b4f8d] bg-[linear-gradient(160deg,#f9fcff,#dfe9fb)] px-4 py-2 text-[10px] uppercase tracking-[0.12em] text-[#284676] shadow-[0_4px_0_rgba(0,0,0,0.18)] sm:text-[11px]"
              >
                <span className="h-2 w-2 rounded-full bg-[#4cd17c] shadow-[0_0_0_1px_rgba(0,0,0,0.25),0_0_8px_rgba(76,209,124,0.56)]" />
                Back To Pokedex
              </RouteTransitionLink>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="auth-mobile-panel auth-red-panel-live rounded-3xl border-2 border-[#a9262c] bg-[linear-gradient(160deg,#cb343a,#b5262d)] p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] sm:p-5">
              <form onSubmit={handleCredentialLogin} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="pixel-font text-[10px] uppercase tracking-[0.14em] text-[#ffe870] sm:text-[12px]">
                      Email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="w-full rounded-lg border border-black/30 bg-[#f9fbff] px-3 py-2 text-sm text-black shadow-[inset_0_2px_0_rgba(0,0,0,0.08)] transition focus:shadow-[0_0_0_2px_rgba(255,232,112,0.42)]"
                      placeholder="trainer@poke.com"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="pixel-font text-[10px] uppercase tracking-[0.14em] text-[#ffe870] sm:text-[12px]">
                      Password
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-black/30 bg-[#f9fbff] px-3 py-2 text-sm text-black shadow-[inset_0_2px_0_rgba(0,0,0,0.08)] transition focus:shadow-[0_0_0_2px_rgba(255,232,112,0.42)]"
                      placeholder="********"
                    />
                  </label>
                </div>

                <div className="auth-mobile-access-grid grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
                  <div className="auth-pokemon-frame-live mx-auto flex h-[124px] w-[124px] items-end justify-center rounded-2xl border border-white/35 bg-white/10 p-2 sm:h-[156px] sm:w-[156px] [animation-delay:120ms]">
                    <Image
                      src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png"
                      alt="Charizard"
                      width={132}
                      height={132}
                      sizes="132px"
                      className="h-[106px] w-[106px] object-contain sm:h-[132px] sm:w-[132px] [image-rendering:pixelated]"
                    />
                  </div>

                  <div className="flex flex-col gap-2 self-center">
                    <button
                      type="submit"
                      disabled={pendingCredentials}
                      className="auth-action-btn-live pixel-font rounded-xl border border-black/30 bg-[#f5f7fa] px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-[#a5282e] shadow-[0_4px_0_rgba(0,0,0,0.18)] transition hover:brightness-105 disabled:opacity-60"
                    >
                      {pendingCredentials ? "Signing In..." : "Login"}
                    </button>
                    <RouteTransitionLink
                      href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                      exitDurationMs={240}
                      className="auth-action-btn-live pixel-font rounded-xl border border-black/30 bg-[#f5f7fa] px-6 py-3 text-center text-[11px] uppercase tracking-[0.12em] text-[#a5282e] shadow-[0_4px_0_rgba(0,0,0,0.18)] transition hover:brightness-105 [animation-delay:180ms]"
                    >
                      Register
                    </RouteTransitionLink>
                  </div>

                  <div className="auth-pokemon-frame-live mx-auto flex h-[124px] w-[124px] items-end justify-center rounded-2xl border border-white/35 bg-white/10 p-2 sm:h-[156px] sm:w-[156px] [animation-delay:320ms]">
                    <Image
                      src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png"
                      alt="Dragonite"
                      width={132}
                      height={132}
                      sizes="132px"
                      className="h-[106px] w-[106px] object-contain sm:h-[132px] sm:w-[132px] [image-rendering:pixelated]"
                    />
                  </div>
                </div>

                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </p>
                ) : null}

                {resendInfo ? (
                  <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                    {resendInfo}
                  </p>
                ) : null}

                {unverifiedEmail ? (
                  <div className="rounded-2xl border border-white/25 bg-white/10 p-3 text-sm text-white/88">
                    <p className="pixel-font text-[10px] uppercase tracking-[0.12em] text-[#ffe870]">
                      Email Confirmation Required
                    </p>
                    <p className="mt-2 leading-6">
                      This trainer account still needs email verification. We can send a fresh
                      DexLoom confirmation link to <strong>{unverifiedEmail}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={pendingResend}
                      className="auth-action-btn-live pixel-font mt-3 rounded-xl border border-black/30 bg-[#f5f7fa] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#a5282e] shadow-[0_4px_0_rgba(0,0,0,0.18)] transition hover:brightness-105 disabled:opacity-60"
                    >
                      {pendingResend ? "Sending Again..." : "Resend Verification Email"}
                    </button>
                  </div>
                ) : null}
              </form>
            </div>

            <div className="auth-mobile-help-card mt-4 rounded-3xl border-2 border-[#c53a3f] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <p className="text-sm text-[#8a2a30]">
                Welcome, Trainer. Sign in with your account credentials, or continue with Google.
              </p>

              <button
                type="button"
                onClick={() => {
                  setPendingGoogle(true);
                  void signIn("google", { callbackUrl });
                }}
                disabled={!googleEnabled || pendingGoogle || !providersLoaded}
                className="auth-google-btn-live pixel-font mt-3 w-full rounded-xl border border-black/28 bg-[linear-gradient(160deg,#dd4346,#af2028)] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-white shadow-[0_5px_0_rgba(0,0,0,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {!providersLoaded
                  ? "Loading Providers..."
                  : googleEnabled
                  ? pendingGoogle
                    ? "Redirecting To Google..."
                    : "Log In With Google"
                  : "Google Sign-In Not Configured"}
              </button>

              {showGoogleConfigHint ? (
                <p className="mt-2 text-xs text-black/60">
                  Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as server environment
                  variables, then restart/redeploy.
                </p>
              ) : null}

              {providersLoadError ? (
                <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {providersLoadError}
                </p>
              ) : null}

              {authError === "AccessDenied" ? (
                <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  This account cannot sign in.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
