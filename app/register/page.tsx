"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useMemo, useState } from "react";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => searchParams.get("callbackUrl") || "/",
    [searchParams]
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setPending(false);
      setError("Passwords do not match.");
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      setPending(false);
      setError(payload?.message ?? "Could not create the account.");
      return;
    }

    setSuccess(payload?.message ?? "Account created successfully.");

    const signInResult = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false
    });

    setPending(false);

    if (signInResult?.error) {
      setError("Account created, but automatic sign-in failed.");
      return;
    }

    router.push(signInResult?.url ?? callbackUrl);
    router.refresh();
  };

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
                Trainer Registration
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="auth-red-panel-live rounded-3xl border-2 border-[#a9262c] bg-[linear-gradient(160deg,#cb343a,#b5262d)] p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] sm:p-5">
              <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-[#ffe870]">
                Register
              </p>
              <h2 className="pixel-font mt-2 text-[13px] uppercase tracking-[0.08em] text-white sm:text-[15px]">
                Create Account With Email
              </h2>

              <form onSubmit={handleRegister} className="mt-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-xs text-white/90">Name (optional)</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-lg border border-black/30 bg-[#f9fbff] px-3 py-2 text-sm text-black shadow-[inset_0_2px_0_rgba(0,0,0,0.08)] transition focus:shadow-[0_0_0_2px_rgba(255,232,112,0.42)]"
                      placeholder="Ash Ketchum"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs text-white/90">Email</span>
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
                    <span className="text-xs text-white/90">Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-black/30 bg-[#f9fbff] px-3 py-2 text-sm text-black shadow-[inset_0_2px_0_rgba(0,0,0,0.08)] transition focus:shadow-[0_0_0_2px_rgba(255,232,112,0.42)]"
                      placeholder="Minimum 8 characters"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs text-white/90">Confirm password</span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-black/30 bg-[#f9fbff] px-3 py-2 text-sm text-black shadow-[inset_0_2px_0_rgba(0,0,0,0.08)] transition focus:shadow-[0_0_0_2px_rgba(255,232,112,0.42)]"
                      placeholder="Repeat your password"
                    />
                  </label>
                </div>

                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </p>
                ) : null}

                {success ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    {success}
                  </p>
                ) : null}

                <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
                  <div className="auth-pokemon-frame-live mx-auto flex h-[116px] w-[116px] items-end justify-center rounded-2xl border border-white/35 bg-white/10 p-2 sm:h-[140px] sm:w-[140px] [animation-delay:100ms]">
                    <Image
                      src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
                      alt="Pikachu"
                      width={118}
                      height={118}
                      sizes="118px"
                      className="h-[96px] w-[96px] object-contain sm:h-[118px] sm:w-[118px] [image-rendering:pixelated]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={pending}
                    className="auth-action-btn-live pixel-font self-center rounded-xl border border-black/30 bg-[#f5f7fa] px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-[#a5282e] shadow-[0_4px_0_rgba(0,0,0,0.18)] transition hover:brightness-105 disabled:opacity-60"
                  >
                    {pending ? "Creating Account..." : "Create Account"}
                  </button>

                  <div className="auth-pokemon-frame-live mx-auto flex h-[116px] w-[116px] items-end justify-center rounded-2xl border border-white/35 bg-white/10 p-2 sm:h-[140px] sm:w-[140px] [animation-delay:260ms]">
                    <Image
                      src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png"
                      alt="Eevee"
                      width={118}
                      height={118}
                      sizes="118px"
                      className="h-[96px] w-[96px] object-contain sm:h-[118px] sm:w-[118px] [image-rendering:pixelated]"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="mt-4 rounded-3xl border-2 border-[#c53a3f] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <p className="text-sm text-[#8a2a30]">
                Already have an account?
                <RouteTransitionLink
                  href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                  exitDurationMs={240}
                  className="ml-2 font-semibold text-[#8a2a30] underline"
                >
                  Sign in here
                </RouteTransitionLink>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
