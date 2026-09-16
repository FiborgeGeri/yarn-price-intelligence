"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import DashboardPage from "@/components/pages/DashboardPage";
import AddPricePage from "@/components/pages/AddPricePage";
import PriceHistoryPage from "@/components/pages/PriceHistoryPage";
import PriceComparisonPage from "@/components/pages/PriceComparisonPage";
import TrendAnalysisPage from "@/components/pages/TrendAnalysisPage";
import MicronAnalysisPage from "@/components/pages/MicronAnalysisPage";
import YarnsPage from "@/components/pages/YarnsPage";
import FactoriesPage from "@/components/pages/FactoriesPage";
import CertificatesPage from "@/components/pages/CertificatesPage";
import TreatmentsPage from "@/components/pages/TreatmentsPage";
import YarnTypesPage from "@/components/pages/YarnTypesPage";
import DyeMethodsPage from "@/components/pages/DyeMethodsPage";
import SpinningTypesPage from "@/components/pages/SpinningTypesPage";
import SalesOrdersPage from "@/components/pages/SalesOrdersPage";
import SettingsPage from "@/components/pages/SettingsPage";
import SearchPage from "@/components/pages/SearchPage";
import CustomersPage from "@/components/pages/CustomersPage";
import CompaniesPage from "@/components/pages/CompaniesPage";
import QuotationsPage from "@/components/pages/QuotationsPage";
import MarginAnalysisPage from "@/components/pages/MarginAnalysisPage";
import PurchaseOrdersPage from "@/components/pages/PurchaseOrdersPage";
import DeliveryNotesPage from "@/components/pages/DeliveryNotesPage";
import GoodsReceiptsPage from "@/components/pages/GoodsReceiptsPage";
import ShipToPage from "@/components/pages/ShipToPage";
import { InvoicesPage, SupplierInvoicesPage } from "@/components/pages/finance/InvoicesModule";
import { PaymentsPage, PayablesPage } from "@/components/pages/finance/PaymentsModule";
import ReconciliationPage from "@/components/pages/ReconciliationPage";
import ReportsPage from "@/components/pages/ReportsPage";
import SystemSettingsPage from "@/components/pages/SystemSettingsPage";
import LoginPage from "@/components/LoginPage";
import { getPermissions, Permissions } from "@/lib/permissions";

interface User { id: number; username: string; displayName: string; role: string; }

export default function Home() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const permissions: Permissions = useMemo(() => getPermissions(user?.role), [user?.role]);

  useEffect(() => {
    try {
      const s = localStorage.getItem("auth_user");
      if (s) setUser(JSON.parse(s));
      
      // 優先檢查是否有 QR Code 掃描未完成的重導向
      const scanTargetPage = sessionStorage.getItem("scanTargetPage");
      if (scanTargetPage) {
        setCurrentPage(scanTargetPage);
        sessionStorage.removeItem("scanTargetPage");
      } else {
        const p = sessionStorage.getItem("fib_page");
        if (p) setCurrentPage(p);
      }
    } catch {}
    setLoading(false);
  }, []);

  // 當使用者在登入頁面完成登入後，再次檢查是否有未完成的 QR 掃描跳轉
  useEffect(() => {
    if (!user) return;
    const scanTargetPage = sessionStorage.getItem("scanTargetPage");
    if (scanTargetPage) {
      setCurrentPage(scanTargetPage);
      sessionStorage.removeItem("scanTargetPage");
    }
  }, [user]);

  // Expired or revoked server session -> back to the login screen.
  useEffect(() => {
    if (!user) return;
    fetch("/api/auth/me")
      .then((r) => { if (r.status === 401) handleLogout(); })
      .catch(() => {});
  }, [user?.id]);

  // Remember the active module across refreshes.
  useEffect(() => {
    try { sessionStorage.setItem("fib_page", currentPage); } catch {}
  }, [currentPage]);

  const handleLogin = (u: User, token: string) => { setUser(u); localStorage.setItem("auth_user", JSON.stringify(u)); localStorage.setItem("auth_token", token); };
  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    try { sessionStorage.removeItem("fib_page"); } catch {}
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-[radial-gradient(circle_at_82%_12%,rgba(229,136,93,0.18),transparent_30rem),linear-gradient(145deg,#fafafa,#f2f2f3,#f8f3f0)]"><div className="text-center rounded-3xl bg-white/55 backdrop-blur-2xl border border-white/80 px-10 py-8 shadow-[0_24px_70px_rgba(64,52,46,0.08)]"><div className="w-12 h-12 border-4 border-[#edaf92] border-t-[#d97449] rounded-full animate-spin mx-auto mb-4" /><p className="text-[#625c59] text-base">Loading Yarn Price Intelligence...</p></div></div>;
  if (!user) return <LoginPage onLogin={handleLogin} />;

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <DashboardPage onNavigate={setCurrentPage} permissions={permissions} />;
      case "search": return <SearchPage permissions={permissions} />;
      case "add-price": return <AddPricePage permissions={permissions} onNavigate={setCurrentPage} />;
      case "price-history": return <PriceHistoryPage permissions={permissions} />;
      case "comparison": return <PriceComparisonPage />;
      case "trends": return <TrendAnalysisPage />;
      case "micron": return <MicronAnalysisPage />;
      case "yarns": return <YarnsPage permissions={permissions} />;
      case "factories": return permissions.canViewQuotations ? <FactoriesPage permissions={permissions} /> : <NoAccess />;
      case "certificates": return <CertificatesPage permissions={permissions} />;
      case "treatments": return <TreatmentsPage permissions={permissions} />;
      case "yarn-types": return <YarnTypesPage permissions={permissions} />;
      case "spinning-types": return <SpinningTypesPage permissions={permissions} />;
      case "dye-methods": return <DyeMethodsPage permissions={permissions} />;
      case "customers": return permissions.canViewQuotations ? <CustomersPage permissions={permissions} /> : <NoAccess />;
      case "companies": return permissions.canViewQuotations ? <CompaniesPage permissions={permissions} /> : <NoAccess />;
      case "ship-to": return permissions.canViewQuotations ? <ShipToPage permissions={permissions} /> : <NoAccess />;
      case "quotations": return permissions.canViewQuotations ? <QuotationsPage permissions={permissions} /> : <NoAccess />;
      case "sales-orders": return permissions.canViewQuotations ? <SalesOrdersPage permissions={permissions} /> : <NoAccess />;
      case "delivery-notes": return permissions.canViewQuotations ? <DeliveryNotesPage permissions={permissions} /> : <NoAccess />;
      case "purchase-orders": return permissions.canViewQuotations ? <PurchaseOrdersPage permissions={permissions} /> : <NoAccess />;
      case "goods-receipts": return permissions.canViewQuotations ? <GoodsReceiptsPage permissions={permissions} /> : <NoAccess />;
      case "margin": return permissions.canViewQuotations ? <MarginAnalysisPage /> : <NoAccess />;
      case "invoices": return permissions.canViewQuotations ? <InvoicesPage permissions={permissions} /> : <NoAccess />;
      case "payments": return permissions.canViewQuotations ? <PaymentsPage permissions={permissions} /> : <NoAccess />;
      case "supplier-invoices": return permissions.canViewQuotations ? <SupplierInvoicesPage permissions={permissions} /> : <NoAccess />;
      case "payables": return permissions.canViewQuotations ? <PayablesPage permissions={permissions} /> : <NoAccess />;
      case "reconciliation": return permissions.canViewQuotations ? <ReconciliationPage /> : <NoAccess />;
      case "reports": return permissions.canViewQuotations ? <ReportsPage /> : <NoAccess />;
      case "system-settings": return permissions.canManageUsers ? <SystemSettingsPage permissions={permissions} /> : <NoAccess />;
      case "settings": return <SettingsPage user={user} permissions={permissions} />;
      default: return <DashboardPage onNavigate={setCurrentPage} permissions={permissions} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} user={user} onLogout={handleLogout} permissions={permissions} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} onLogout={handleLogout} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50">{renderPage()}</main>
      </div>
    </div>
  );
}

function NoAccess() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
        <h3 className="text-lg font-medium text-slate-600">Access Restricted</h3>
        <p className="text-sm text-slate-400 mt-1">Your account does not have permission to view this section.</p>
      </div>
    </div>
  );
}