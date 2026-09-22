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

const TEMPLATE_KEYS = [
  { key: "template_quotation_remarks", label: "Quotation Footer Remarks (報價單條款)" },
  { key: "template_po_remarks", label: "Purchase Order Footer Remarks (採購單條款)" },
  { key: "template_dn_remarks", label: "Delivery Note Footer Remarks (送貨單條款)" },
  { key: "template_invoice_remarks", label: "Sales Invoice Footer Remarks (銷售發票條款)" },
  { key: "template_supplier_invoice_remarks", label: "Supplier Invoice Footer Remarks (供應商發票條款)" }
];

export default function SystemSettingsPage({ permissions }: { permissions: Permissions }) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 用於局部修改 state
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system-settings");
      if (res.ok) {
        const data: Setting[] = await res.json();
        setSettings(data);
        
        // 篩選出我們關心的 Remarks 模板並回填
        const vals: Record<string, string> = {};
        TEMPLATE_KEYS.forEach(tk => {
          const match = data.find(s => s.key === tk.key);
          vals[tk.key] = match?.value || "";
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
      const payload = TEMPLATE_KEYS.map(tk => ({
        key: tk.key,
        value: templateValues[tk.key] || ""
      }));

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
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-sm text-slate-500">Configure global document templates, clauses and baseline behaviors.</p>
      </div>

      {toast && (
        <div className={`p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {toast.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">Document Remarks Templates</h2>
          <p className="text-xs text-slate-400">Configure default terms, MOQ clauses, or payment guidelines printed at the bottom of Excel files.</p>
        </div>

        <div className="space-y-4">
          {TEMPLATE_KEYS.map((tk) => (
            <div key={tk.key} className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {tk.label}
              </label>
              <textarea
                value={templateValues[tk.key] || ""}
                onChange={(e) => handleValueChange(tk.key, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={5}
                placeholder={`Enter standard clauses for ${tk.label.split(" (")[0]}`}
              />
            </div>
          ))}
        </div>

        {permissions.canManageUsers && (
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
