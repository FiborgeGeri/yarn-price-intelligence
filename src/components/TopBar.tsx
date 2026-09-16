"use client";
import { useState, useEffect, useRef } from "react";
import { Menu, LogOut, ChevronDown, CircleUserRound, Clock } from "lucide-react";
import GlobalSearch from "@/components/GlobalSearch";

interface Props {
  user: { username: string; displayName: string; role: string };
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export default function TopBar({ user, onLogout, onToggleSidebar }: Props) {
  const [showProfile, setShowProfile] = useState(false);
  const [now, setNow] = useState(new Date());
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dayStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <header className="h-14 bg-white/55 backdrop-blur-2xl border-b border-white/80 flex items-center justify-between px-4 shrink-0 gap-4">
      {/* Left side: Sidebar Toggle & Clock (時鐘在小螢幕自動隱藏，避免擠壓) */}
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={onToggleSidebar} className="p-2 hover:bg-white/80 rounded-xl lg:hidden transition-colors">
          <Menu className="w-5 h-5 text-[#6d625b]" />
        </button>
        <div className="hidden md:flex items-center gap-3 rounded-full border border-white/80 bg-white/60 px-4 py-1.5 shadow-[0_4px_16px_rgba(70,58,52,0.05)]">
          <Clock className="w-3.5 h-3.5 text-[#d96f3c]" />
          <span className="text-[13px] font-medium text-[#5c524b]">{dayStr}</span>
          <span className="h-4 w-px bg-[#e3d5cb]" />
          <span className="tnum font-mono text-[13px] text-[#8c7d73]">{timeStr}</span>
        </div>
      </div>

      {/* Center: Global Search Bar (寬度自適應，最大 450px) */}
      <div className="flex-1 max-w-xs md:max-w-md">
        <GlobalSearch />
      </div>

      {/* Right side: User Profile dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 hover:bg-white/80 rounded-full transition-colors border border-transparent hover:border-white/80"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#f8d7c8] to-[#e2733f] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {user.displayName?.[0] || user.username[0].toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-[13px] font-semibold leading-tight text-[#38312d]">{user.displayName || user.username}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#a89b92] leading-tight">{user.role}</div>
            </div>
            <ChevronDown className={`hidden md:block w-3.5 h-3.5 text-[#b3a49b] transition-transform ${showProfile ? "rotate-180" : ""}`} />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-2xl z-50 py-2 animate-fade-up overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-3 border-b border-[#f0e6df]">
                <CircleUserRound className="w-8 h-8 text-[#e0a07c]" strokeWidth={1.4} />
                <div className="min-w-0">
                  <div className="font-semibold text-[13px] text-[#38312d] truncate">{user.displayName || user.username}</div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-[#a89b92]">{user.role} access</div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full px-4 py-2.5 text-left text-[13px] text-[#b7492f] hover:bg-[#fdf0ea] flex items-center gap-2.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
