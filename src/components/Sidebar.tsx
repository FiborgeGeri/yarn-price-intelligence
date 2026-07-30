"use client";
import { IconDashboard, IconPlus, IconClipboard, IconScale, IconTrendUp, IconMicroscope, IconYarn, IconFactory, IconCertificate, IconFlask, IconSettings, IconLogout, IconSearch, IconUsers, IconFileText, IconPercent } from "./Icons";
import { type ReactNode } from "react";
import { type Permissions } from "@/lib/permissions";

interface NavItem { key: string; label: string; icon: ReactNode; requireQuotation?: boolean; }

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: <IconDashboard className="w-[18px] h-[18px]" /> },
  { key: "search", label: "Search Yarn", icon: <IconSearch className="w-[18px] h-[18px]" /> },
  { key: "add-price", label: "Add Price", icon: <IconPlus className="w-[18px] h-[18px]" /> },
  { key: "price-history", label: "Price History", icon: <IconClipboard className="w-[18px] h-[18px]" /> },
  { key: "comparison", label: "Price Comparison", icon: <IconScale className="w-[18px] h-[18px]" /> },
  { key: "trends", label: "Trend Analysis", icon: <IconTrendUp className="w-[18px] h-[18px]" /> },
  { key: "micron", label: "Micron Analysis", icon: <IconMicroscope className="w-[18px] h-[18px]" /> },
  { key: "yarns", label: "Yarns", icon: <IconYarn className="w-[18px] h-[18px]" /> },
  { key: "factories", label: "Factories", icon: <IconFactory className="w-[18px] h-[18px]" /> },
  { key: "certificates", label: "Certificates", icon: <IconCertificate className="w-[18px] h-[18px]" /> },
  { key: "treatments", label: "Treatments", icon: <IconFlask className="w-[18px] h-[18px]" /> },
  // Quotation section
  { key: "quotations", label: "Quotations", icon: <IconFileText className="w-[18px] h-[18px]" />, requireQuotation: true },
  { key: "customers", label: "Customers", icon: <IconUsers className="w-[18px] h-[18px]" />, requireQuotation: true },
  { key: "margin", label: "Margin Analysis", icon: <IconPercent className="w-[18px] h-[18px]" />, requireQuotation: true },
  // Settings
  { key: "settings", label: "User Settings", icon: <IconSettings className="w-[18px] h-[18px]" /> },
];

interface Props {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  user: { username: string; displayName: string; role: string };
  onLogout: () => void;
  permissions: Permissions;
}

export default function Sidebar({ currentPage, onNavigate, isOpen, onToggle, user, onLogout, permissions }: Props) {
  const visibleItems = NAV_ITEMS.filter((item) => !item.requireQuotation || permissions.canViewQuotations);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onToggle} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-200 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden"}`}>
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center"><IconTrendUp className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-base leading-tight">Yarn Price Intel</div><div className="text-xs text-slate-400 mt-0.5">Price Tracking System</div></div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {visibleItems.map((item, i) => {
            // Add separator before quotation section
            const prevItem = visibleItems[i - 1];
            const showSep = item.requireQuotation && prevItem && !prevItem.requireQuotation && item.key !== "settings";
            return (
              <div key={item.key}>
                {showSep && (
                  <div className="mx-4 my-2 border-t border-slate-700/50">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 mt-2 px-0">Quotation</span>
                  </div>
                )}
                <button
                  onClick={() => { onNavigate(item.key); if (window.innerWidth < 1024) onToggle(); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${currentPage === item.key ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                >
                  <span className="w-5 flex justify-center shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">{user.displayName?.[0] || user.username[0].toUpperCase()}</div>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{user.displayName || user.username}</div><div className="text-xs text-slate-400">{user.role}</div></div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white py-1 transition-colors text-left">
            <IconLogout className="w-3.5 h-3.5" /><span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
