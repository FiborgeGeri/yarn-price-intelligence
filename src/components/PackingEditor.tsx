"use client";

export interface PackingBox {
  packageNo: string;
  packageType: string; // "Carton", "Bag", "Pallet", etc.
  cones: string;
  condWeight: string;
  grossWeight: string;
  netWeight: string;
  lotNo: string;
}

const PACKAGE_TYPES = ["Carton", "Box", "Bag", "Pallet", "Bale", "Crate", "Roll", "Package", "Other"];

const EMPTY_BOX: PackingBox = { packageNo: "", packageType: "", cones: "", condWeight: "", grossWeight: "", netWeight: "", lotNo: "" };

/** Parse stored JSON string into PackingBox[]; tolerate legacy free-text and old format. */
export function parsePacking(raw: string | null | undefined): PackingBox[] {
  if (!raw) return [];
  const t = raw.trim();
  if (!t) return [];
  if (t.startsWith("[")) {
    try {
      const arr = JSON.parse(t);
      if (Array.isArray(arr)) {
        return arr.map((b: Record<string, unknown>) => ({
          packageNo: String(b.packageNo ?? b.boxNo ?? ""),
          packageType: String(b.packageType ?? ""),
          cones: String(b.cones ?? ""),
          condWeight: String(b.condWeight ?? ""),
          grossWeight: String(b.grossWeight ?? ""),
          netWeight: String(b.netWeight ?? ""),
          lotNo: String(b.lotNo ?? ""),
        }));
      }
    } catch {}
  }
  return [{ ...EMPTY_BOX, packageNo: t.split("\n")[0].slice(0, 40) }];
}

export function serializePacking(boxes: PackingBox[]): string | null {
  const clean = boxes.filter((b) => b.packageNo || b.cones || b.condWeight || b.grossWeight || b.netWeight || b.lotNo);
  return clean.length ? JSON.stringify(clean) : null;
}

export function packingTotals(boxes: PackingBox[]) {
  const num = (v: string) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  return {
    count: boxes.length,
    cones: boxes.reduce((s, b) => s + num(b.cones), 0),
    cond: boxes.reduce((s, b) => s + num(b.condWeight), 0),
    gross: boxes.reduce((s, b) => s + num(b.grossWeight), 0),
    net: boxes.reduce((s, b) => s + num(b.netWeight), 0),
  };
}

interface EditorProps {
  boxes: PackingBox[];
  onChange: (boxes: PackingBox[]) => void;
}

/** Structured, package-by-package packing list editor. */
export function PackingEditor({ boxes, onChange }: EditorProps) {
  const totals = packingTotals(boxes);
  const pkgType = boxes[0]?.packageType || "Carton";

  const update = (idx: number, patch: Partial<PackingBox>) =>
    onChange(boxes.map((b, i) => (i === idx ? { ...b, ...patch } : b)));

  const renumber = (list: PackingBox[], type?: string) =>
    list.map((b, i) => ({ ...b, packageNo: b.packageNo || `${i + 1} of ${list.length}`, packageType: type ?? b.packageType }));

  const addRow = () => onChange(renumber([...boxes, { ...EMPTY_BOX }]));

  const removeRow = (idx: number) => onChange(renumber(boxes.filter((_, i) => i !== idx)));

  const addMany = () => {
    const raw = prompt(`How many ${pkgType.toLowerCase()}s to add?`, "10");
    const n = Math.min(Math.max(parseInt(raw || "0", 10) || 0, 0), 200);
    if (!n) return;
    const created = Array.from({ length: n }, () => ({ ...EMPTY_BOX }));
    onChange(renumber([...boxes, ...created]));
  };

  const fillDown = (field: keyof PackingBox) => {
    if (!boxes.length) return;
    const v = boxes[0][field];
    onChange(boxes.map((b) => ({ ...b, [field]: v })));
  };

  const changePackageType = (type: string) => {
    onChange(renumber(boxes.map(b => ({ ...b, packageType: type })), type));
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-700">Packing List ({totals.count})</span>
          <select value={pkgType} onChange={(e) => changePackageType(e.target.value)} className="text-[10px] px-1.5 py-0.5 border border-slate-300 rounded bg-white">
            {PACKAGE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={addRow} className="text-[11px] px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50">+ Add</button>
          <button type="button" onClick={addMany} className="text-[11px] px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50">+ Many</button>
        </div>
      </div>

      {boxes.length === 0 ? (
        <div className="px-3 py-4 text-[11px] text-slate-400 text-center">No packages yet — click "+ Add" or "+ Many".</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left">
                <th className="px-2 py-1.5 font-medium w-28">Package</th>
                <th className="px-2 py-1.5 font-medium w-16">
                  <div className="flex items-center gap-1">Cones<button type="button" onClick={() => fillDown("cones")} title="Fill down" className="text-slate-400 hover:text-blue-600">↓</button></div>
                </th>
                <th className="px-2 py-1.5 font-medium w-24">
                  <div className="flex items-center gap-1">Cond. Wt<button type="button" onClick={() => fillDown("condWeight")} title="Fill down" className="text-slate-400 hover:text-blue-600">↓</button></div>
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
                  <td className="px-2 py-1"><input value={b.packageNo} onChange={(e) => update(i, { packageNo: e.target.value })} className="w-full px-1.5 py-1 border border-slate-200 rounded" placeholder={`${i + 1} of ${boxes.length}`} /></td>
                  <td className="px-2 py-1"><input value={b.cones} onChange={(e) => update(i, { cones: e.target.value })} className="w-full px-1.5 py-1 border border-slate-200 rounded" placeholder="12" /></td>
                  <td className="px-2 py-1"><input value={b.condWeight} onChange={(e) => update(i, { condWeight: e.target.value })} className="w-full px-1.5 py-1 border border-slate-200 rounded" placeholder="24.0" /></td>
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
                <td className="px-2 py-1.5">{totals.cond ? totals.cond.toFixed(2) : "—"}</td>
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
export function PackingView({ raw }: { raw: string | null | undefined; weightUnit?: string }) {
  const boxes = parsePacking(raw);
  if (!boxes.length) return null;
  const totals = packingTotals(boxes);
  const pkgType = boxes[0]?.packageType || "Carton";
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
      <table className="w-full text-[11px] min-w-[700px]">
        <thead>
          <tr className="bg-slate-50 text-slate-600 text-left">
            <th className="px-2 py-1.5 font-medium">{pkgType}</th>
            <th className="px-2 py-1.5 font-medium">Cones</th>
            <th className="px-2 py-1.5 font-medium">Cond. Wt</th>
            <th className="px-2 py-1.5 font-medium">Gross Wt</th>
            <th className="px-2 py-1.5 font-medium">Net Wt</th>
            <th className="px-2 py-1.5 font-medium">Lot No.</th>
          </tr>
        </thead>
        <tbody>
          {boxes.map((b, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="px-2 py-1.5 font-medium">{b.packageNo || i + 1}</td>
              <td className="px-2 py-1.5">{b.cones || "—"}</td>
              <td className="px-2 py-1.5">{b.condWeight || "—"}</td>
              <td className="px-2 py-1.5">{b.grossWeight || "—"}</td>
              <td className="px-2 py-1.5">{b.netWeight || "—"}</td>
              <td className="px-2 py-1.5">{b.lotNo || "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-700">
            <td className="px-2 py-1.5">{totals.count} {pkgType.toLowerCase()}s</td>
            <td className="px-2 py-1.5">{totals.cones || "—"}</td>
            <td className="px-2 py-1.5">{totals.cond ? totals.cond.toFixed(2) : "—"}</td>
            <td className="px-2 py-1.5">{totals.gross ? totals.gross.toFixed(2) : "—"}</td>
            <td className="px-2 py-1.5">{totals.net ? totals.net.toFixed(2) : "—"}</td>
            <td className="px-2 py-1.5" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
