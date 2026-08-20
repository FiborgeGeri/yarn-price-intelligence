"use client";

export interface PackingBox {
  boxNo: string;
  cones: string;
  grossWeight: string;
  netWeight: string;
  lotNo: string;
}

const EMPTY_BOX: PackingBox = { boxNo: "", cones: "", grossWeight: "", netWeight: "", lotNo: "" };

/** Parse stored JSON string into PackingBox[]; tolerate legacy free-text. */
export function parsePacking(raw: string | null | undefined): PackingBox[] {
  if (!raw) return [];
  const t = raw.trim();
  if (!t) return [];
  if (t.startsWith("[")) {
    try {
      const arr = JSON.parse(t);
      if (Array.isArray(arr)) {
        return arr.map((b: Partial<PackingBox>) => ({
          boxNo: String(b.boxNo ?? ""),
          cones: String(b.cones ?? ""),
          grossWeight: String(b.grossWeight ?? ""),
          netWeight: String(b.netWeight ?? ""),
          lotNo: String(b.lotNo ?? ""),
        }));
      }
    } catch {}
  }
  // Legacy plain text -> one box row holding the note
  return [{ ...EMPTY_BOX, boxNo: t.split("\n")[0].slice(0, 40) }];
}

export function serializePacking(boxes: PackingBox[]): string | null {
  const clean = boxes.filter((b) => b.boxNo || b.cones || b.grossWeight || b.netWeight || b.lotNo);
  return clean.length ? JSON.stringify(clean) : null;
}

export function packingTotals(boxes: PackingBox[]) {
  const num = (v: string) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  return {
    count: boxes.length,
    cones: boxes.reduce((s, b) => s + num(b.cones), 0),
    gross: boxes.reduce((s, b) => s + num(b.grossWeight), 0),
    net: boxes.reduce((s, b) => s + num(b.netWeight), 0),
  };
}

interface EditorProps {
  boxes: PackingBox[];
  onChange: (boxes: PackingBox[]) => void;
  weightUnit?: string;
}

/** Structured, box-by-box packing list editor. */
export function PackingEditor({ boxes, onChange, weightUnit = "" }: EditorProps) {
  const totals = packingTotals(boxes);

  const update = (idx: number, patch: Partial<PackingBox>) =>
    onChange(boxes.map((b, i) => (i === idx ? { ...b, ...patch } : b)));

  const addRow = () => {
    const next = [...boxes, { ...EMPTY_BOX }];
    onChange(next.map((b, i) => ({ ...b, boxNo: b.boxNo || `${i + 1} of ${next.length}` })));
  };

  const removeRow = (idx: number) => {
    const next = boxes.filter((_, i) => i !== idx);
    onChange(next.map((b, i) => ({ ...b, boxNo: `${i + 1} of ${next.length}` })));
  };

  const addMany = () => {
    const raw = prompt("How many boxes to add?", "10");
    const n = Math.min(Math.max(parseInt(raw || "0", 10) || 0, 0), 200);
    if (!n) return;
    const start = boxes.length;
    const total = start + n;
    const created = Array.from({ length: n }, (_, i) => ({ ...EMPTY_BOX, boxNo: `${start + i + 1} of ${total}` }));
    const next = [...boxes, ...created].map((b, i) => ({ ...b, boxNo: `${i + 1} of ${total}` }));
    onChange(next);
  };

  const fillDown = (field: keyof PackingBox) => {
    if (!boxes.length) return;
    const v = boxes[0][field];
    onChange(boxes.map((b) => ({ ...b, [field]: v })));
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-200">
        <span className="text-[11px] font-semibold text-slate-700">Packing List ({totals.count} box{totals.count === 1 ? "" : "es"})</span>
        <div className="flex gap-2">
          <button type="button" onClick={addRow} className="text-[11px] px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50">+ Box</button>
          <button type="button" onClick={addMany} className="text-[11px] px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50">+ Many</button>
        </div>
      </div>

      {boxes.length === 0 ? (
        <div className="px-3 py-4 text-[11px] text-slate-400 text-center">No boxes yet — click “+ Box” or “+ Many”.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] min-w-[560px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left">
                <th className="px-2 py-1.5 font-medium w-28">Box</th>
                <th className="px-2 py-1.5 font-medium w-20">
                  <div className="flex items-center gap-1">Cones<button type="button" onClick={() => fillDown("cones")} title="Fill down" className="text-slate-400 hover:text-blue-600">↓</button></div>
                </th>
                <th className="px-2 py-1.5 font-medium w-24">
                  <div className="flex items-center gap-1">Gross Wt<button type="button" onClick={() => fillDown("grossWeight")} title="Fill down" className="text-slate-400 hover:text-blue-600">↓</button></div>
                </th>
                <th className="px-2 py-1.5 font-medium w-24">
                  <div className="flex items-center gap-1">Net Wt<button type="button" onClick={() => fillDown("netWeight")} title="Fill down" className="text-slate-400 hover:text-blue-600">↓</button></div>
                </th>
                <th className="px-2 py-1.5 font-medium w-28">
                  <div className="flex items-center gap-1">Lot No.<button type="button" onClick={() => fillDown("lotNo")} title="Fill down" className="text-slate-400 hover:text-blue-600">↓</button></div>
                </th>
                <th className="px-2 py-1.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {boxes.map((b, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-2 py-1"><input value={b.boxNo} onChange={(e) => update(i, { boxNo: e.target.value })} className="w-full px-1.5 py-1 border border-slate-200 rounded" placeholder={`${i + 1} of ${boxes.length}`} /></td>
                  <td className="px-2 py-1"><input value={b.cones} onChange={(e) => update(i, { cones: e.target.value })} className="w-full px-1.5 py-1 border border-slate-200 rounded" placeholder="12" /></td>
                  <td className="px-2 py-1"><input value={b.grossWeight} onChange={(e) => update(i, { grossWeight: e.target.value })} className="w-full px-1.5 py-1 border border-slate-200 rounded" placeholder="25.5" /></td>
                  <td className="px-2 py-1"><input value={b.netWeight} onChange={(e) => update(i, { netWeight: e.target.value })} className="w-full px-1.5 py-1 border border-slate-200 rounded" placeholder="24.0" /></td>
                  <td className="px-2 py-1"><input value={b.lotNo} onChange={(e) => update(i, { lotNo: e.target.value })} className="w-full px-1.5 py-1 border border-slate-200 rounded" placeholder="LOT-A1" /></td>
                  <td className="px-2 py-1 text-center"><button type="button" onClick={() => removeRow(i)} className="text-red-500 hover:text-red-700">✕</button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-700">
                <td className="px-2 py-1.5">Total</td>
                <td className="px-2 py-1.5">{totals.cones || "—"}</td>
                <td className="px-2 py-1.5">{totals.gross ? totals.gross.toFixed(2) : "—"}</td>
                <td className="px-2 py-1.5">{totals.net ? totals.net.toFixed(2) : "—"}</td>
                <td className="px-2 py-1.5" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

/** Read-only packing table for detail views. */
export function PackingView({ raw, weightUnit = "" }: { raw: string | null | undefined; weightUnit?: string }) {
  const boxes = parsePacking(raw);
  if (!boxes.length) return null;
  const totals = packingTotals(boxes);
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
      <table className="w-full text-[11px] min-w-[520px]">
        <thead>
          <tr className="bg-slate-50 text-slate-600 text-left">
            <th className="px-2 py-1.5 font-medium">Box</th>
            <th className="px-2 py-1.5 font-medium">Cones</th>
            <th className="px-2 py-1.5 font-medium">Gross Wt</th>
            <th className="px-2 py-1.5 font-medium">Net Wt</th>
            <th className="px-2 py-1.5 font-medium">Lot No.</th>
          </tr>
        </thead>
        <tbody>
          {boxes.map((b, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="px-2 py-1.5 font-medium">{b.boxNo || i + 1}</td>
              <td className="px-2 py-1.5">{b.cones || "—"}</td>
              <td className="px-2 py-1.5">{b.grossWeight || "—"}</td>
              <td className="px-2 py-1.5">{b.netWeight || "—"}</td>
              <td className="px-2 py-1.5">{b.lotNo || "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-700">
            <td className="px-2 py-1.5">{totals.count} boxes</td>
            <td className="px-2 py-1.5">{totals.cones || "—"}</td>
            <td className="px-2 py-1.5">{totals.gross ? totals.gross.toFixed(2) : "—"}</td>
            <td className="px-2 py-1.5">{totals.net ? totals.net.toFixed(2) : "—"}</td>
            <td className="px-2 py-1.5" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
