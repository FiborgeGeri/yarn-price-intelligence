"use client";

import { useState, useEffect, useRef } from "react";
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
  const [savingStage, setSavingStage] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [localStage, setLocalStage] = useState(currentStage || "Order Confirmed");
  const [localNote, setLocalNote] = useState(currentNote || "");
  const noteRef = useRef(currentNote || "");

  // 當外部資料更新時同步（只在真正改變時才更新）
  useEffect(() => {
    setLocalStage(currentStage || "Order Confirmed");
  }, [currentStage]);

  useEffect(() => {
    const incoming = currentNote || "";
    if (incoming !== noteRef.current) {
      setLocalNote(incoming);
      noteRef.current = incoming;
    }
  }, [currentNote]);

  const currentIdx = STAGES.indexOf(localStage);
  const pct = currentIdx >= 0 ? Math.round(((currentIdx + 1) / STAGES.length) * 100) : 0;

  const handleStageChange = async (newStage: string) => {
    if (savingStage) return;
    const prev = localStage;
    setLocalStage(newStage);
    setSavingStage(true);

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
        setLocalStage(prev);
      }
    } catch {
      alert("Network error while updating stage.");
      setLocalStage(prev);
    } finally {
      setSavingStage(false);
    }
  };

  const handleNoteBlur = async () => {
    const trimmed = localNote.trim();
    // 如果 note 沒變，就不需要存
    if (trimmed === (currentNote || "").trim()) return;

    setSavingNote(true);
    noteRef.current = trimmed;

    try {
      const res = await fetch("/api/order-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          orderId,
          itemId,
          stage: localStage,
          stageNote: trimmed,
          userId: getUserId(),
        }),
      });

      if (res.ok) {
        if (onStageChange) onStageChange();
      }
    } catch {
      // 靜默失敗，不中斷用戶操作
    } finally {
      setSavingNote(false);
    }
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
        disabled={savingStage}
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
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="Add stage note..."
        disabled={savingNote}
        className={`w-full px-1.5 py-0.5 border rounded text-[10px] text-slate-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 placeholder:text-slate-300 ${
          savingNote ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-slate-50"
        }`}
      />
    </div>
  );
}
