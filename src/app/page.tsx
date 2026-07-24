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
import SettingsPage from "@/components/pages/SettingsPage";
import SearchPage from "@/components/pages/SearchPage";
import LoginPage from "@/components/LoginPage";
import { getPermissions, Permissions } from "@/lib/permissions";

interface User {
  id: number;
  username: string;
  displayName: string;
  role: string;
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const permissions: Permissions = useMemo(() => {
    return getPermissions(user?.role);
  }, [user?.role]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setLoading(false);
  }, []);

  const handleLogin = (u: User, token: string) => {
    setUser(u);
    localStorage.setItem("auth_user", JSON.stringify(u));
    localStorage.setItem("auth_token", token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Loading Yarn Price Intelligence...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigate={setCurrentPage} permissions={permissions} />;
      case "search":
        return <SearchPage />;
      case "add-price":
        return <AddPricePage permissions={permissions} onNavigate={setCurrentPage} />;
      case "price-history":
        return <PriceHistoryPage permissions={permissions} />;
      case "comparison":
        return <PriceComparisonPage />;
      case "trends":
        return <TrendAnalysisPage />;
      case "micron":
        return <MicronAnalysisPage />;
      case "yarns":
        return <YarnsPage permissions={permissions} />;
      case "factories":
        return <FactoriesPage permissions={permissions} />;
      case "certificates":
        return <CertificatesPage permissions={permissions} />;
      case "treatments":
        return <TreatmentsPage permissions={permissions} />;
      case "settings":
        return <SettingsPage user={user} permissions={permissions} />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} permissions={permissions} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          user={user}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
