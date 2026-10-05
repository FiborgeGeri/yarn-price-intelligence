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
  "Shipped",
  "Delivered",
  "Received",
];

const STAGE_COLORS: Record<string, string> = {
  "Order Confirmed": "bg-blue-500",
  "Lab Dip Confirmed": "bg-purple-500",
  "Dyeing": "bg-amber-500",
  "Lot Confirmed": "bg-indigo-500",
  "Packing": "bg-orange-500",
  "Ready to Ship": "bg-cyan-500",
  "Ex Mill": "bg-teal-500",
  "Shipped": "bg-green-500",
  "Delivered": "bg-emerald-600",
  "Received": "bg-emerald-600",
};

interface StageLog {
  id: number;
  stage: string;
  stageDate: string;
  notes: string | null;
}

interface Props {
  orderType: "so" | "po";
  orderId: number;
  itemId: number;
  currentStage: string;
  canEdit: boolean;
  onStageChange?: () => void;
}

export default function OrderStageTracker({ orderType, orderId, itemId, currentStage, canEdit, onStageChange }: Props) {
  const [logs, setLogs] = useState<StageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [newStage, setNewStage] = useState(currentStage);
  const [stageNotes, setStageNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadLogs = async () => {
    try {
      const res = await fetch(`/api/order-stages?orderType=${orderType}&orderId=${orderId}&itemId=${itemId}`);
      if (res.ok) setLogs(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, [orderType, orderId, itemId]);

  const currentStageIndex = STAGES.indexOf(currentStage);
  const progressPercent = currentStageIndex >= 0 ? Math.round(((currentStageIndex + 1) / STAGES.length) * 100) : 0;

  const handleStageUpdate = async () => {
    if (!newStage || newStage === currentStage) return;
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
          notes: stageNotes,
          userId: getUserId(),
        }),
      });
      if (res.ok) {
        loadLogs();
        setStageNotes("");
        if (onStageChange) onStageChange();
      }
    } catch {}
    setSaving(false);
  };

  return (
    <div className="space-y-2">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-600">Progress</span>
          <span className="text-xs font-bold text-slate-700">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${STAGE_COLORS[currentStage] || "bg-blue-500"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-[10px] font-semibold text-slate-600 mt-0.5">{currentStage}</div>
      </div>

      {canEdit && (
        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
          <div className="flex flex-wrap gap-1 mb-2">
            {STAGES.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setNewStage(s)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border transition ${
                  newStage === s
                    ? `${STAGE_COLORS[s]} text-white border-transparent`
                    : i <= currentStageIndex
                    ? "bg-slate-200 text-slate-600 border-slate-300"
                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {newStage !== currentStage && (
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
              />
              <button
                type="button"
                onClick={handleStageUpdate}
                disabled={saving}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "..." : "Update"}
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowLog(!showLog)}
        className="text-[10px] text-blue-600 hover:underline font-medium"
      >
        {showLog ? "Hide" : "Show"} history ({logs.length})
      </button>

      {showLog && (
        <div className="space-y-0.5 max-h-32 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-[10px] text-slate-400">No history</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-center gap-2 text-[10px] text-slate-600 bg-slate-50 rounded px-2 py-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${STAGE_COLORS[log.stage] || "bg-slate-400"}`} />
                <span className="font-semibold">{log.stage}</span>
                <span className="text-slate-400">{new Date(log.stageDate).toLocaleDateString()}</span>
                {log.notes && <span className="text-slate-500 italic">- {log.notes}</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
