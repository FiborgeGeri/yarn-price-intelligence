"use client";

import { useEffect, useState } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";

interface Setting {
  id?: number;
  key: string;
  value: string | null;
  description?: string | null;
}

// 🆕 每個文件類型都有英文(en)與中文(zh)兩套範本
const TEMPLATE_KEYS = [
  { base: "template_quotation_remarks", label: "Quotation Footer Remarks", labelZh: "報價單條款" },
  { base: "template_po_remarks",        label: "Purchase Order Footer Remarks", labelZh: "採購單條款" },
  { base: "template_dn_remarks",        label: "Delivery Note Footer Remarks", labelZh: "送貨單條款" },
  { base: "template_invoice_remarks",   label: "Sales Invoice Footer Remarks", labelZh: "銷售發票條款" },
  { base: "template_supplier_invoice_remarks", label: "Supplier Invoice Footer Remarks", labelZh: "供應商發票條款" },
  { base: "template_reconciliation_remarks", label: "Reconciliation Footer Remarks", labelZh: "對帳單條款" },
];

export default function SystemSettingsPage({ permissions }: { permissions: Permissions }) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"en" | "zh">("en");

  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system-settings");
      if (res.ok) {
        const data: Setting[] = await res.json();
        setSettings(data);

        const vals: Record<string, string> = {};
        TEMPLATE_KEYS.forEach(tk => {
          ["en", "zh"].forEach(lang => {
            const key = `${tk.base}_${lang}`;
            const match = data.find(s => s.key === key);
            vals[key] = match?.value || "";
          });
          // 相容舊格式：若尚無 _en / _zh 但有舊 key，就作為英文版預設帶入
          const legacyKey = tk.base;
          const legacyMatch = data.find(s => s.key === legacyKey);
          if (legacyMatch?.value && !vals[`${tk.base}_en`]) {
            vals[`${tk.base}_en`] = legacyMatch.value;
          }
        });
        setTemplateValues(vals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleValueChange = (key: string, value: string) => {
    setTemplateValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canManageUsers) return;
    setSaving(true);
    try {
      const payload: Array<{ key: string; value: string }> = [];
      TEMPLATE_KEYS.forEach(tk => {
        ["en", "zh"].forEach(lang => {
          const key = `${tk.base}_${lang}`;
          payload.push({ key, value: templateValues[key] || "" });
        });
      });

      const res = await fetch("/api/system-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload, userId: getUserId() }),
      });

      if (res.ok) {
        setToast({ type: "success", text: "Settings saved successfully" });
        loadData();
      } else {
        setToast({ type: "error", text: "Failed to save settings" });
      }
    } catch {
      setToast({ type: "error", text: "Error connecting to server" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#e5885d] border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-sm text-slate-500">Configure global document templates, clauses and baseline behaviors.</p>
      </div>

      {toast && (
        <div className={`p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Document Remarks Templates</h2>
            <p className="text-xs text-slate-400">
              English version applies to international clients. Chinese version applies when client/supplier country is China (CN/中國).
            </p>
          </div>
        </div>

        {/* 🆕 語言切換 Tab */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("en")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "en"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            English (國際)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("zh")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "zh"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            中文 (China)
          </button>
        </div>

        <div className="space-y-4">
          {TEMPLATE_KEYS.map((tk) => {
            const key = `${tk.base}_${activeTab}`;
            return (
              <div key={key} className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  {activeTab === "en" ? tk.label : tk.labelZh}
                  <span className="ml-2 text-slate-400 font-normal normal-case">
                    ({activeTab === "en" ? "English" : "中文"})
                  </span>
                </label>
                <textarea
                  value={templateValues[key] || ""}
                  onChange={(e) => handleValueChange(key, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#e5885d] focus:border-[#e5885d]"
                  rows={6}
                  placeholder={
                    activeTab === "en"
                      ? `Enter standard English clauses for ${tk.label.replace(" Footer Remarks", "")}...\n\nExample:\n1. All prices are quoted in USD, FOB Shanghai.\n2. Payment terms: T/T 30 days from BL date.\n3. Delivery within 45 days after order confirmation.`
                      : `請輸入${tk.labelZh.replace("條款", "")}的中文條款...\n\n範例：\n1. 本報價以人民幣結算，含增值稅。\n2. 付款方式：款到發貨。\n3. 交貨期：訂單確認後 45 天內交貨。`
                  }
                />
              </div>
            );
          })}
        </div>

        {permissions.canManageUsers && (
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#d97449] text-white rounded-lg text-sm font-medium hover:bg-[#b7492f] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : `Save ${activeTab === "en" ? "English" : "Chinese"} Templates`}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}