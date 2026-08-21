"use client";
import { IconDashboard, IconPlus, IconClipboard, IconScale, IconTrendUp, IconMicroscope, IconYarn, IconFactory, IconCertificate, IconFlask, IconSettings, IconLogout, IconSearch, IconUsers, IconFileText, IconPercent, IconShoppingCart, IconMapPin, IconDollar, IconLayers, IconRefresh, IconDroplet, IconBeaker, IconClock, IconTruck, IconPackage, IconBarChart, IconMail, IconShoppingBag, IconReceipt, IconWallet, IconBuilding, IconCreditCard, IconArrowLeftRight, IconSliders } from "./Icons";import { type ReactNode } from "react";
import { type Permissions } from "@/lib/permissions";

interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  section?: string;
  indent?: boolean;
  requireAuth?: boolean;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  // Overview
  { key: "dashboard", label: "Dashboard", icon: <IconDashboard className="w-[18px] h-[18px]" />, section: "Overview" },
  { key: "search", label: "Search Yarn", icon: <IconSearch className="w-[18px] h-[18px]" /> },

  // Products
  { key: "yarns", label: "All Yarns", icon: <IconYarn className="w-[18px] h-[18px]" />, section: "Products" },
  { key: "yarn-types", label: "Yarn Types", icon: <IconLayers className="w-[18px] h-[18px]" />, indent: true },
  { key: "spinning-types", label: "Spinning Types", icon: <IconRefresh className="w-[18px] h-[18px]" />, indent: true },
  { key: "dye-methods", label: "Dye Methods", icon: <IconDroplet className="w-[18px] h-[18px]" />, indent: true },
  { key: "treatments", label: "Treatments", icon: <IconBeaker className="w-[18px] h-[18px]" />, indent: true },
  { key: "certificates", label: "Certificates", icon: <IconCertificate className="w-[18px] h-[18px]" />, indent: true },

  // Pricing
  { key: "add-price", label: "Add Price", icon: <IconPlus className="w-[18px] h-[18px]" />, section: "Pricing" },
  { key: "price-history", label: "Price History", icon: <IconClock className="w-[18px] h-[18px]" />, indent: true },
  { key: "comparison", label: "Price Comparison", icon: <IconScale className="w-[18px] h-[18px]" />, indent: true },
  { key: "trends", label: "Trend Analysis", icon: <IconTrendUp className="w-[18px] h-[18px]" />, indent: true },
  { key: "micron", label: "Micron Analysis", icon: <IconMicroscope className="w-[18px] h-[18px]" />, indent: true },

  // Contacts
  { key: "factories", label: "Yarn Mills", icon: <IconFactory className="w-[18px] h-[18px]" />, section: "Contacts" },
  { key: "customers", label: "Customers", icon: <IconUsers className="w-[18px] h-[18px]" />, requireAuth: true },
  { key: "ship-to", label: "Ship-To Addresses", icon: <IconMapPin className="w-[18px] h-[18px]" />, requireAuth: true },

  // Sales
  { key: "quotations", label: "Quotations", icon: <IconMail className="w-[18px] h-[18px]" />, section: "Sales", requireAuth: true },
  { key: "sales-orders", label: "Sales Orders", icon: <IconShoppingBag className="w-[18px] h-[18px]" />, requireAuth: true },
  { key: "delivery-notes", label: "Delivery Notes", icon: <IconTruck className="w-[18px] h-[18px]" />, requireAuth: true },
  { key: "invoices", label: "Invoices", icon: <IconReceipt className="w-[18px] h-[18px]" />, requireAuth: true, comingSoon: true },
  { key: "payments", label: "Payments / Receivables", icon: <IconWallet className="w-[18px] h-[18px]" />, requireAuth: true, comingSoon: true },
  { key: "margin", label: "Margin Analysis", icon: <IconPercent className="w-[18px] h-[18px]" />, requireAuth: true },

  // Purchasing
  { key: "purchase-orders", label: "Purchase Orders", icon: <IconShoppingCart className="w-[18px] h-[18px]" />, section: "Purchasing", requireAuth: true },
  { key: "goods-receipts", label: "Goods Receipts", icon: <IconPackage className="w-[18px] h-[18px]" />, requireAuth: true },
  { key: "supplier-invoices", label: "Supplier Invoices", icon: <IconBuilding className="w-[18px] h-[18px]" />, requireAuth: true, comingSoon: true },
  { key: "payables", label: "Payables", icon: <IconCreditCard className="w-[18px] h-[18px]" />, requireAuth: true, comingSoon: true },

  // Finance
  { key: "reconciliation", label: "Reconciliation", icon: <IconArrowLeftRight className="w-[18px] h-[18px]" />, section: "Finance", requireAuth: true, comingSoon: true },
  { key: "reports", label: "Reports", icon: <IconBarChart className="w-[18px] h-[18px]" />, requireAuth: true, comingSoon: true },

  // Settings
  { key: "settings", label: "User Settings", icon: <IconSettings className="w-[18px] h-[18px]" />, section: "Settings" },
  { key: "system-settings", label: "System Settings", icon: <IconSliders className="w-[18px] h-[18px]" />, comingSoon: true },
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
  const visibleItems = NAV_ITEMS.filter((item) => !item.requireAuth || permissions.canViewQuotations);

  let lastSection = "";

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onToggle} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/65 backdrop-blur-2xl text-[#545150] border-r border-white/80 flex flex-col transform transition-transform duration-200 shadow-[8px_0_36px_rgba(70,58,52,0.035)] ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden"}`}>
        <div className="p-4 border-b border-[#e7e2df]/70">
          <div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/90 shadow-sm bg-white/50">
  <img
    src="/images/fib_infinity.png"
    alt="Fiborge"
    className="w-full h-full object-contain p-1"
  />
</div>            <div>
              <div className="font-semibold text-sm leading-tight text-[#242222]">Fiborge&apos;s Sales &amp; Sourcing Hub</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {visibleItems.map((item) => {
            const showSep = item.section && item.section !== lastSection;
            if (item.section) lastSection = item.section;

            return (
              <div key={item.key}>
                {showSep && (
                  <div className="mx-4 my-2 border-t border-[#e7e2df]/70">
                    <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9a9491] mt-2 px-0">{item.section}</span>
                  </div>
                )}
                {item.comingSoon ? (
                  <div className={`w-full flex items-center gap-3 ${item.indent ? "pl-8 pr-4" : "px-4"} py-2 text-sm text-[#aaa4a1] cursor-not-allowed`}>
                    <span className="w-5 flex justify-center shrink-0 opacity-50">{item.icon}</span>
                    <span>{item.label}</span>
                    <span className="ml-auto text-[9px] uppercase tracking-wider text-[#99918d] bg-white/65 px-1.5 py-0.5 rounded">Soon</span>
                  </div>
                ) : (
                  <button
                    onClick={() => { onNavigate(item.key); if (window.innerWidth < 1024) onToggle(); }}
                    className={`w-full flex items-center gap-3 ${item.indent ? "pl-8 pr-4" : "px-4"} py-2 text-sm transition-colors ${currentPage === item.key ? "bg-gradient-to-r from-[#fff5ef]/95 via-[#fae0d4]/78 to-white/35 text-[#a25333] font-semibold border-y border-white/70 shadow-[0_8px_26px_rgba(217,119,77,0.07)]" : "text-[#686360] hover:bg-white/65 hover:text-[#292626]"}`}
                  >
                    <span className="w-5 flex justify-center shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#e7e2df]/70">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#f8d7c8] to-[#e78b61] text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">{user.displayName?.[0] || user.username[0].toUpperCase()}</div>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium text-[#383433] truncate">{user.displayName || user.username}</div><div className="text-xs text-[#96908d]">{user.role}</div></div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 text-xs text-[#8b8582] hover:text-[#b75e3b] py-1 transition-colors text-left">
            <IconLogout className="w-3.5 h-3.5" /><span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
