"use client";

import { useState, useEffect } from "react";

const STAGES = [
  "On Hold",
  "Order Confirmed",
  "Lab Dipping",
  "Lab Dip Confirmed",
  "Dyeing",
  "Lot Confirmed",
  "Packing",
  "Ready to Ship",
  "Ex Mill",
];

const STAGE_COLORS: Record<string, string> = {
  "On Hold": "bg-slate-400",
  "Order Confirmed": "bg-blue-500",
  "Lab Dipping": "bg-violet-400",
  "Lab Dip Confirmed": "bg-purple-500",
  "Dyeing": "bg-amber-500",
  "Lot Confirmed": "bg-indigo-500",
  "Packing": "bg-orange-500",
  "Ready to Ship": "bg-cyan-500",
  "Ex Mill": "bg-emerald-500",
};

interface Props {
  currentStage: string;
  currentNote?: string;
  canEdit: boolean;
  onLocalChange?: (stage: string, note: string) => void;
}

export default function OrderStageTracker({
  currentStage,
  currentNote = "",
  canEdit,
  onLocalChange,
}: Props) {
  const [localStage, setLocalStage] = useState(currentStage || "Order Confirmed");
  const [localNote, setLocalNote] = useState(currentNote || "");

  useEffect(() => { setLocalStage(currentStage || "Order Confirmed"); }, [currentStage]);
  useEffect(() => { setLocalNote(currentNote || ""); }, [currentNote]);

  const currentIdx = STAGES.indexOf(localStage);
  const pct = currentIdx >= 0 ? Math.round(((currentIdx + 1) / STAGES.length) * 100) : 0;

  const handleStageChange = (newStage: string) => {
    setLocalStage(newStage);
    if (onLocalChange) onLocalChange(newStage, localNote);
  };

  const handleNoteChange = (newNote: string) => {
    setLocalNote(newNote);
    if (onLocalChange) onLocalChange(localStage, newNote);
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
        className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-[11px] font-semibold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input
        type="text"
        value={localNote}
        onChange={(e) => handleNoteChange(e.target.value)}
        
        placeholder="Add stage note..."
        className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[10px] text-slate-600 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 placeholder:text-slate-300"
      />
    </div>
  );
}
