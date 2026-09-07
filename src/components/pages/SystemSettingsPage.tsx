"use client";

import { useState, useEffect, useCallback } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";

interface SettingRow {
  id: number; key: string; value: string | null; description: string | null;
  updatedAt: string | null; updatedByName: string | null;
}
interface Toast { type: "success" | "error"; text: string }

export default function SystemSettingsPage({ permissions }: { permissions: Permissions }) {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((t: Toast) => { setToast(t); setTimeout(() => setToast(null), 3000); }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/system-settings").then((r) => r.json()).then((d: SettingRow[]) => {
      const list = Array.isArray(d) ? d : [];
      setRows(list);
      setDraft(Object.fromEntries(list.map((r) => [r.key, r.value ?? ""])));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const dirty = rows.some((r) => (draft[r.key] ?? "") !== (r.value ?? ""));

  const save = async () => {
    setSaving(true);
    const updates = rows.filter((r) => (draft[r.key] ?? "") !== (r.value ?? "")).map((r) => ({ key: r.key, value: draft[r.key] ?? "" }));
    const res = await fetch("/api/system-settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates, userId: getUserId() }),
    });
    if (res.ok) { showToast({ type: "success", text: "Settings saved" }); load(); }
    else showToast({ type: "error", text: "Failed to save" });
    setSaving(false);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>{toast.text}</div>}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-900">System Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Global defaults used across documents — e.g. the VAT rate preselected on new invoices
          (per-document rates can always be changed when creating an invoice).
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {loading && <div className="p-8 text-center text-slate-400 text-sm">Loading…</div>}
        {!loading && rows.map((r) => (
          <div key={r.key} className="p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <div className="font-mono text-sm font-semibold text-slate-800">{r.key}</div>
              <div className="text-xs text-slate-500 mt-0.5">{r.description}</div>
              {r.updatedByName && <div className="text-[10px] text-slate-400 mt-1">Last updated by {r.updatedByName}</div>}
            </div>
            <input
              value={draft[r.key] ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, [r.key]: e.target.value }))}
              disabled={!permissions.canEdit}
              className="w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
        ))}
      </div>

      {permissions.canEdit && (
        <div className="flex gap-3">
          <button onClick={save} disabled={saving || !dirty} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : "Save Settings"}</button>
          <button onClick={load} disabled={!dirty} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 disabled:opacity-50">Revert</button>
        </div>
      )}
    </div>
  );
}
