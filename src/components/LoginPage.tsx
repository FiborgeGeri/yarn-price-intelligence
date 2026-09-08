"use client";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2, Sparkles } from "lucide-react";

interface Props {
  onLogin: (user: { id: number; username: string; displayName: string; role: string }, token: string) => void;
}

const TICKER_ITEMS = [
  "Innovation",
  "Price Intelligence",
  "Sustainability",
  "Global Sourcing",
  "Realtime Insights",
  "Traceability",
  "Merino Excellence",
  "Sourcing Hub",
];

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Login failed");
      else onLogin(data.user, data.token);
    } catch {
      setError("Connection error — please try again in a few seconds");
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f3f0] lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ——— Brand hero panel ——— */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden">
        <img
          src="/images/login-hero.jpg"
          alt="Premium worsted wool yarn cones"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(58,33,24,0.72)_0%,rgba(96,52,34,0.45)_42%,rgba(217,119,77,0.25)_100%)]" />
        <div className="absolute inset-0 dot-grid opacity-40" />
        <div className="pointer-events-none absolute -top-32 -right-24 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(255,196,158,0.35),transparent_65%)] aurora-drift" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(255,150,101,0.28),transparent_65%)] aurora-drift-slower" />

        <div className="relative z-10 p-12">
          <div className="flex items-center gap-3 animate-fade-up">
            <div className="h-11 w-11 rounded-2xl bg-white/12 backdrop-blur-xl border border-white/25 flex items-center justify-center shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
              <img src="/images/fib_infinity.png" alt="Fiborge" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <div className="font-display text-lg text-white leading-tight">Fiborge</div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">Sales &amp; Sourcing Hub</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-12 pt-0">
          <h1 className="font-display text-[3.4rem] leading-[1.04] text-white animate-fade-up delay-1">
            Yarn price
            <br />
            <span className="italic text-[#ffd9c2]">intelligence</span>,
            <br />
            from mill to market.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70 animate-fade-up delay-2">
            Track mill and competitor prices, quote with confidence, and run your
            orders, deliveries and receivables — all in one workspace.
          </p>
        </div>

        {/* Marquee ticker */}
        <div className="relative z-10 border-t border-white/12 bg-black/18 backdrop-blur-md py-3 overflow-hidden">
          <div className="ticker flex w-max items-center gap-8 whitespace-nowrap px-4">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/62">
                <Sparkles className="h-3 w-3 text-[#ffb48c]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ——— Form panel ——— */}
      <div className="relative flex min-h-screen lg:min-h-0 items-center justify-center px-5 py-10">
        <div className="pointer-events-none absolute -right-28 -top-24 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,211,188,0.85),rgba(230,133,88,0.4)_48%,transparent_74%)] aurora-drift" />
        <div className="pointer-events-none absolute -bottom-52 -left-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(243,201,181,0.4),transparent_70%)] aurora-drift-slower" />

        <div className="relative z-10 w-full max-w-[26rem]">
          {/* Mobile brand */}
          <div className="text-center mb-8 lg:hidden">
            <img src="/images/fib_infinity.png" alt="Fiborge" className="h-16 w-16 object-contain mx-auto mb-3" />
            <div className="font-display text-xl text-[#2d2320]">Fiborge</div>
          </div>

          <div className="animate-fade-up">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c06a41] mb-2">Welcome back</div>
            <h2 className="font-display text-[2rem] leading-tight text-[#241d1a]">Sign in to your workspace</h2>
            <p className="mt-1.5 text-sm text-[#8a7d77]">Prices, quotes and orders — where you left them.</p>
          </div>

          <form onSubmit={handleSubmit} className="glass-panel mt-7 rounded-[1.6rem] p-6 sm:p-7 animate-fade-up delay-1">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 animate-fade-in">
                {error}
              </div>
            )}

            <label className="block mb-4">
              <span className="mb-1.5 block text-[13px] font-medium text-[#52463f]">Username</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-[#e3d9d2] bg-white/80 px-3.5 py-2.5 text-[#241d1a] placeholder-[#b3a49c] shadow-[inset_0_1px_2px_rgba(84,60,48,0.05)] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#e58a61]/35 focus:border-[#e58a61]/50"
                placeholder="e.g. admin"
                autoComplete="username"
                required
              />
            </label>

            <label className="block mb-5">
              <span className="mb-1.5 block text-[13px] font-medium text-[#52463f]">Password</span>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#e3d9d2] bg-white/80 px-3.5 py-2.5 pr-11 text-[#241d1a] placeholder-[#b3a49c] shadow-[inset_0_1px_2px_rgba(84,60,48,0.05)] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#e58a61]/35 focus:border-[#e58a61]/50"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a29388] hover:text-[#b55f3e] transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#ee9a72_0%,#e2733f_100%)] py-3 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(217,119,77,0.35)] transition-all hover:shadow-[0_14px_32px_rgba(217,119,77,0.45)] hover:-translate-y-px disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#a08d81] animate-fade-up delay-2">
            Yarn Price Intelligence · sessions secured with signed tokens
          </p>
        </div>
      </div>
    </div>
  );
}
