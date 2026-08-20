"use client";
import { useState, useEffect, useRef } from "react";
import { IconMenu, IconLogout } from "./Icons";

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
    <header className="h-14 bg-white/55 backdrop-blur-2xl border-b border-white/80 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="p-1.5 hover:bg-slate-100 rounded-lg lg:hidden">
          <IconMenu className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex items-center gap-3">
          <div>
            <div className="text-sm font-medium text-slate-700">{dayStr}</div>
          </div>
          <div className="h-4 w-px bg-slate-300/60" />
          <div className="font-mono text-sm tabular-nums text-slate-600">{timeStr}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div ref={profileRef} className="relative">
          <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-[#f8d7c8] to-[#e78b61] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {user.displayName?.[0] || user.username[0].toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-slate-900">{user.displayName || user.username}</div>
              <div className="text-xs text-slate-500">{user.role}</div>
            </div>
          </button>
          {showProfile && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="font-medium text-slate-900 text-sm">{user.displayName || user.username}</div>
                <div className="text-xs text-slate-500">{user.role}</div>
              </div>
              <button onClick={onLogout} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <IconLogout className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
