"use client";
import { useState, useEffect } from "react";

interface YarnDetail {
  id: number; yarnName: string; factoryId: number; yarnCount: string;
  yarnTypeId: number; yarnTypeName: string;
  micron: string; treatmentId: number; origin: string; composition: string;
  color: string; notes: string; factoryName: string; relationship: string;
  treatmentName: string; certIds: number[]; dyeMethodIds: number[]; dyeMethodNames: string[];
  latestPrice: number | null; latestCurrency: string | null;
  latestUnit: string | null; latestPriceDate: string | null;
}

interface Certificate { id: number; certCode: string; certFullName: string; }

export function useYarnDetail() {
  const [viewingYarn, setViewingYarn] = useState<YarnDetail | null>(null);
  const [yarnLoading, setYarnLoading] = useState(false);
  const [allCerts, setAllCerts] = useState<Certificate[]>([]);

  useEffect(() => { fetch("/api/certificates").then((r) => r.json()).then(setAllCerts).catch(() => {}); }, []);

  const openYarnDetail = async (yarnId: number) => {
    setYarnLoading(true);
    try {
      const res = await fetch(`/api/yarns?ids=${yarnId}`);
      const data = await res.json();
      if (data[0]) setViewingYarn(data[0]);
    } catch {}
    setYarnLoading(false);
  };

  return { viewingYarn, setViewingYarn, yarnLoading, openYarnDetail, allCerts };
}

export function YarnDetailModal({ yarn, certs, onClose }: { yarn: YarnDetail; certs: Certificate[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border-t-4 ${yarn.relationship === "My Factory" ? "border-blue-500" : "border-red-500"}`} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${yarn.relationship === "My Factory" ? "bg-blue-500" : "bg-red-500"}`} /><h2 className="text-xl font-bold text-slate-900">{yarn.yarnName}</h2></div>
            <p className="text-sm text-slate-500 mt-1">{yarn.factoryName} · {yarn.relationship === "My Factory" ? "Mine" : "Competitor"}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none p-1">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500 text-xs block mb-0.5">Composition</span><div className="font-medium">{yarn.composition || "—"}</div></div>
            <div><span className="text-slate-500 text-xs block mb-0.5">Yarn Count</span><div className="font-medium">{yarn.yarnCount || "—"}</div></div>
            <div><span className="text-slate-500 text-xs block mb-0.5">Micron</span><div className="font-medium">{yarn.micron ? `${yarn.micron}μm` : "—"}</div></div>
            <div><span className="text-slate-500 text-xs block mb-0.5">Treatment</span><div className="font-medium">{yarn.treatmentName || "—"}</div></div>
            <div><span className="text-slate-500 text-xs block mb-0.5">Yarn Type</span><div className="font-medium">{yarn.yarnTypeName || "—"}</div></div>
            <div><span className="text-slate-500 text-xs block mb-0.5">Dye Method</span><div className="font-medium">{yarn.dyeMethodNames?.length ? yarn.dyeMethodNames.join(", ") : "—"}</div></div>
            <div><span className="text-slate-500 text-xs block mb-0.5">Origin</span><div className="font-medium">{yarn.origin || "—"}</div></div>
            <div><span className="text-slate-500 text-xs block mb-0.5">Color</span><div className="font-medium">{yarn.color || "—"}</div></div>
          </div>
          {yarn.latestPrice != null && (
            <div className="border-t border-slate-200 pt-4"><span className="text-slate-500 text-xs block mb-0.5">Latest Price</span><div className="text-lg font-bold font-mono">{yarn.latestCurrency || "USD"} {yarn.latestPrice.toFixed(2)} <span className="text-sm font-normal text-slate-500">{yarn.latestUnit || "per KG"}</span></div><div className="text-xs text-slate-400">{yarn.latestPriceDate}</div></div>
          )}
          {yarn.certIds?.length > 0 && (
            <div className="border-t border-slate-200 pt-4"><span className="text-slate-500 text-xs block mb-1">Certificates</span><div className="flex flex-wrap gap-1.5">{certs.filter((c) => yarn.certIds.includes(c.id)).map((c) => <span key={c.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{c.certCode}</span>)}</div></div>
          )}
          {yarn.notes && <div className="border-t border-slate-200 pt-4"><span className="text-slate-500 text-xs block mb-0.5">Notes</span><p className="text-sm text-slate-700 whitespace-pre-line">{yarn.notes}</p></div>}
        </div>
        <div className="p-4 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300">Close</button>
        </div>
      </div>
    </div>
  );
}
