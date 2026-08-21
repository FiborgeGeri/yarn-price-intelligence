"use client";
import { useState } from "react";

interface Props {
  onLogin: (user: { id: number; username: string; displayName: string; role: string }, token: string) => void;
}

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
      setError("Connection error");
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 bg-[linear-gradient(145deg,#fafafa_0%,#f0f0f1_48%,#f7f1ee_100%)]">
      <div className="pointer-events-none absolute -right-28 -top-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,211,188,0.9),rgba(230,133,88,0.62)_48%,rgba(226,123,74,0.06)_74%,transparent_75%)] blur-[1px]" />
      <div className="pointer-events-none absolute -bottom-52 -left-40 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(243,201,181,0.42),rgba(245,226,218,0.2)_58%,transparent_72%)]" />
      <div className="pointer-events-none absolute left-[12%] top-[14%] h-28 w-28 rounded-full border border-white/80 bg-white/28 backdrop-blur-xl" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-7">
          <img
            src="/images/fib_infinity.png"
            alt="Fiborge"
            className="relative z-10 h-20 w-20 object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-[#252222]">Welcome to Fiborge&apos;s Hub</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-2xl rounded-[1.5rem] p-6 shadow-[0_24px_70px_rgba(64,52,46,0.11)] border border-white/90">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{error}</div>}

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#514c4a] mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/76 border border-white rounded-xl text-[#242222] placeholder-[#aaa4a1] shadow-[inset_0_0_0_1px_rgba(196,190,187,0.38)] focus:outline-none focus:ring-2 focus:ring-[#e58a61]/30"
              placeholder="Enter username"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#514c4a] mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 bg-white/76 border border-white rounded-xl text-[#242222] placeholder-[#aaa4a1] shadow-[inset_0_0_0_1px_rgba(196,190,187,0.38)] focus:outline-none focus:ring-2 focus:ring-[#e58a61]/30"
                placeholder="Enter password"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#918b88] hover:text-[#b55f3e]">
                {showPw ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
