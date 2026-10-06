"use client";

import { useState, useEffect } from "react";
import { getUserId } from "@/lib/getUserId";

const STAGES = [
  "Order Confirmed",
  "Lab Dip Confirmed",
  "Dyeing",
  "Lot Confirmed",
  "Packing",
  "Ready to Ship",
  "Ex Mill",
];

const STAGE_COLORS: Record<string, string> = {
  "Order Confirmed": "bg-blue-500",
  "Lab Dip Confirmed": "bg-purple-500",
  "Dyeing": "bg-amber-500",
  "Lot Confirmed": "bg-indigo-500",
  "Packing": "bg-orange-500",
  "Ready to Ship": "bg-cyan-500",
  "Ex Mill": "bg-emerald-500",
};

interface Props {
  orderType: "so" | "po";
  orderId: number;
  itemId: number;
  currentStage: string;
  currentNote?: string;
  canEdit: boolean;
  onStageChange?: () => void;
}

export default function OrderStageTracker({
  orderType,
  orderId,
  itemId,
  currentStage,
  currentNote = "",
  canEdit,
  onStageChange,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [localStage, setLocalStage] = useState(currentStage || "Order Confirmed");
  const [localNote, setLocalNote] = useState(currentNote || "");

  // 當外部資料更新時同步 localState
  useEffect(() => {
    setLocalStage(currentStage || "Order Confirmed");
  }, [currentStage]);

  useEffect(() => {
    setLocalNote(currentNote || "");
  }, [currentNote]);

  const currentIdx = STAGES.indexOf(localStage);
  const pct = currentIdx >= 0 ? Math.round(((currentIdx + 1) / STAGES.length) * 100) : 0;

  const handleStageChange = async (newStage: string) => {
    if (saving) return;
    const prev = localStage;
    setLocalStage(newStage); // 先立即變更 UI 提高流暢感
    setSaving(true);

    try {
      const res = await fetch("/api/order-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          orderId,
          itemId,
          stage: newStage,
          stageNote: localNote,
          userId: getUserId(),
        }),
      });

      if (res.ok) {
        if (onStageChange) onStageChange();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to update stage: ${err.error || "Unknown error"}`);
        setLocalStage(prev); // 失敗時復原
      }
    } catch (e) {
      alert("Network error while updating stage.");
      setLocalStage(prev);
    } finally {
      setSaving(false);
    }
  };

  const handleNoteBlur = async () => {
    if (localNote === currentNote || saving) return;
    setSaving(true);
    try {
      await fetch("/api/order-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          orderId,
          itemId,
          stage: localStage,
          stageNote: localNote,
          userId: getUserId(),
        }),
      });
      if (onStageChange) onStageChange();
    } catch {}
    setSaving(false);
  };

  if (!canEdit) {
    return (
      <div className="min-w-[130px]">
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
          <div className={`h-full rounded-full ${STAGE_COLORS[localStage] || "bg-blue-500"}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${STAGE_COLORS[localStage] || "bg-blue-500"} text-white mb-0.5`}>
          {localStage}
        </span>
        {localNote && <div className="text-[10px] text-slate-500 italic truncate" title={localNote}>{localNote}</div>}
      </div>
    );
  }

  return (
    <div className="min-w-[140px] space-y-1">
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${STAGE_COLORS[localStage] || "bg-blue-500"}`} style={{ width: `${pct}%` }} />
      </div>

      <select
        value={localStage}
        onChange={(e) => handleStageChange(e.target.value)}
        disabled={saving}
        className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-[11px] font-semibold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 cursor-pointer"
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <input
        type="text"
        value={localNote}
        onChange={(e) => setLocalNote(e.target.value)}
        onBlur={handleNoteBlur}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        placeholder="Add stage note..."
        className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[10px] text-slate-600 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 placeholder:text-slate-300"
      />
    </div>
  );
}
