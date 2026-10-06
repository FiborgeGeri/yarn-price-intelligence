"use client";

import { useState } from "react";
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
  canEdit: boolean;
  onStageChange?: () => void;
}

export default function OrderStageTracker({ orderType, orderId, itemId, currentStage, canEdit, onStageChange }: Props) {
  const [saving, setSaving] = useState(false);
  const [localStage, setLocalStage] = useState(currentStage || "Order Confirmed");

  const currentIdx = STAGES.indexOf(localStage);
  const pct = currentIdx >= 0 ? Math.round(((currentIdx + 1) / STAGES.length) * 100) : 0;

  const updateStage = async (newStage: string) => {
    if (newStage === localStage || saving) return;
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
          userId: getUserId(),
        }),
      });
      if (res.ok) {
        setLocalStage(newStage);
        if (onStageChange) onStageChange();
      }
    } catch {}
    setSaving(false);
  };

  if (!canEdit) {
    return (
      <div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
          <div className={`h-full rounded-full ${STAGE_COLORS[localStage] || "bg-blue-500"}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${STAGE_COLORS[localStage] || "bg-blue-500"} text-white`}>
          {localStage}
        </span>
      </div>
    );
  }

  return (
    <div className="min-w-[120px]">
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
        <div className={`h-full rounded-full transition-all duration-300 ${STAGE_COLORS[localStage] || "bg-blue-500"}`} style={{ width: `${pct}%` }} />
      </div>
      <select
        value={localStage}
        onChange={(e) => updateStage(e.target.value)}
        disabled={saving}
        className="w-full px-1 py-0.5 border border-slate-200 rounded text-[10px] font-semibold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
