"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";
import AuditInfo from "@/components/AuditInfo";
import { PackingEditor, PackingView, parsePacking, serializePacking, packingTotals, type PackingBox } from "@/components/PackingEditor";

interface GRItem { id: number; grId: number; yarnId: number; yarnName: string; yarnCount: string; composition: string; colorName: string; colorCode: string; quantityOrdered: string; quantityReceived: string; weightBasis: string; packages: number; packingDetails: string; grossWeight: string; netWeight: string; lotNo: string; inspectionResult: string; notes: string; }
interface GR { id: number; grNo: string; poId: number | null; poNo: string; factoryId: number; factoryName: string; shipToId: number | null; shipToName: string | null; shipToContactName: string | null; quantityUnit: string; grDate: string; shippingMethod: string; trackingNo: string; totalPackages: number; totalGrossWeight: string; totalNetWeight: string; status: string; notes: string; items: GRItem[]; createdByName: string | null; updatedByName: string | null; }
interface Factory { id: number; factoryName: string; relationship: string; }
interface ShipTo { id: number; name: string; category: string; }
interface PO { id: number; poNo: string; factoryId: number; factoryName: string; customerId: number; customerName: string; customerPoNo: string; shipToId: number | null; shipToName: string | null; shipToContactId: number | null; shipToContactName: string | null; soNo: string; orderCategory: string; status: string; items: { yarnId: number; yarnName: string; yarnCount: string; colorName: string; colorCode: string; quantity: string; }[]; }
interface Yarn { id: number; yarnName: string; factoryName: string; yarnCount: string; }
interface FormItem { yarnId: number; colorName: string; colorCode: string; quantityOrdered: string; quantityReceived: string; weightBasis: string; packingBoxes: PackingBox[]; grossWeight: string; netWeight: string; lotNo: string; notes: string; }
interface Props { permissions: Permissions; }

const STATUS_COLORS: Record<string, string> = { "Shipped from Mill": "bg-blue-100 text-blue-800", "In Transit": "bg-amber-100 text-amber-800", "Arrived at Port": "bg-cyan-100 text-cyan-800", "Customs Clearance": "bg-purple-100 text-purple-800", Delivered: "bg-green-100 text-green-800", Completed: "bg-emerald-100 text-emerald-800", "On Hold": "bg-red-100 text-red-800" };
const EMPTY_ITEM: FormItem = { yarnId: 0, colorName: "", colorCode: "", quantityOrdered: "", quantityReceived: "", weightBasis: "condition", packingBoxes: [], grossWeight: "", netWeight: "", lotNo: "", notes: "" };

export default function GoodsReceiptsPage({ permissions }: Props) {
  const [grs, setGrs] = useState<GR[]>([]);
  const [factoryList, setFactoryList] = useState<Factory[]>([]);
  const [shipToList, setShipToList] = useState<ShipTo[]>([]);
  const [poList, setPoList] = useState<PO[]>([]);
  const [yarnList, setYarnList] = useState<Yarn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GR | null>(null);
  const [viewing, setViewing] = useState<GR | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [fPoId, setFPoId] = useState(0);
  const [fFactory, setFFactory] = useState(0);
  const [fShipTo, setFShipTo] = useState(0);
  const [fQtyUnit, setFQtyUnit] = useState("KGS");
  const [fGrDate, setFGrDate] = useState(new Date().toISOString().split("T")[0]);
  const [fShippingMethod, setFShippingMethod] = useState("");
  const [fTrackingNo, setFTrackingNo] = useState("");
  const [fStatus, setFStatus] = useState("Shipped from Mill");
  const [fNotes, setFNotes] = useState("");
  const [fItems, setFItems] = useState<FormItem[]>([{ ...EMPTY_ITEM }]);
  const [fAutoCreateDN, setFAutoCreateDN] = useState(true);

  const load = async () => { setLoading(true); const [g, f, st, p, y] = await Promise.all([fetch("/api/goods-receipts").then(r => r.json()), fetch("/api/factories").then(r => r.json()), fetch("/api/ship-to-addresses").then(r => r.json()), fetch("/api/purchase-orders").then(r => r.json()), fetch("/api/yarns").then(r => r.json())]); setGrs(g); setFactoryList(f); setShipToList(st); setPoList(p); setYarnList(y); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => { if (!search.trim()) return grs; const s = search.toLowerCase(); return grs.filter(g => g.grNo?.toLowerCase().includes(s) || g.factoryName?.toLowerCase().includes(s) || g.poNo?.toLowerCase().includes(s) || g.trackingNo?.toLowerCase().includes(s) || g.shipToName?.toLowerCase().includes(s)); }, [grs, search]);

  const openForm = (gr?: GR) => {
    if (gr) { setEditing(gr); setFPoId(gr.poId || 0); setFFactory(gr.factoryId); setFShipTo(gr.shipToId || 0); setFQtyUnit(gr.quantityUnit || "KGS"); setFGrDate(gr.grDate); setFShippingMethod(gr.shippingMethod || ""); setFTrackingNo(gr.trackingNo || ""); setFStatus(gr.status || "Shipped from Mill"); setFNotes(gr.notes || ""); setFAutoCreateDN(false); setFItems(gr.items.map(i => ({ yarnId: i.yarnId, colorName: i.colorName || "", colorCode: i.colorCode || "", quantityOrdered: i.quantityOrdered || "", quantityReceived: i.quantityReceived || "", packingBoxes: parsePacking(i.packingDetails), weightBasis: i.weightBasis || "condition", grossWeight: i.grossWeight || "", netWeight: i.netWeight || "", lotNo: i.lotNo || "", notes: i.notes || "" }))); }
    else { setEditing(null); setFPoId(0); setFFactory(0); setFShipTo(0); setFQtyUnit("KGS"); setFQtyUnit("KGS"); setFGrDate(new Date().toISOString().split("T")[0]); setFShippingMethod(""); setFTrackingNo(""); setFStatus("Shipped from Mill"); setFNotes(""); setFAutoCreateDN(true); setFItems([{ ...EMPTY_ITEM }]); }
    setShowForm(true);
  };

  const loadFromPO = (poId: number) => {
    const po = poList.find(p => p.id === poId);
    if (!po) return;
    setFPoId(poId); setFFactory(po.factoryId); setFShipTo(po.shipToId || 0); setFQtyUnit((po as PO & { quantityUnit?: string }).quantityUnit || "KGS");
    setFItems(po.items.map((i: PO["items"][0]) => ({ yarnId: i.yarnId, colorName: i.colorName || "", colorCode: i.colorCode || "", quantityOrdered: i.quantity || "", quantityReceived: i.quantity || "", weightBasis: "condition", packingBoxes: [], grossWeight: "", netWeight: "", lotNo: "", notes: "" })));
    setToast({ type: "success", text: `Loaded ${po.items.length} item(s) from ${po.poNo}` }); setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async () => {
    if (!fFactory) { setToast({ type: "error", text: "Select a yarn mill" }); return; }
    const validItems = fItems.filter(i => i.yarnId);
    if (!validItems.length) { setToast({ type: "error", text: "Add at least one item" }); return; }
    setSaving(true);
    const po = poList.find(p => p.id === fPoId);
    const res = await fetch("/api/goods-receipts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing?.id, poId: fPoId || null, poNo: po?.poNo || null, factoryId: fFactory, shipToId: fShipTo || null, shipToContactId: po?.shipToContactId || null, quantityUnit: fQtyUnit, grDate: fGrDate, shippingMethod: fShippingMethod, trackingNo: fTrackingNo, status: fStatus, notes: fNotes, items: validItems.map(i => { const t = packingTotals(i.packingBoxes); return { ...i, packages: t.count || null, packingDetails: serializePacking(i.packingBoxes), grossWeight: i.grossWeight || (t.gross ? t.gross.toFixed(2) : ""), netWeight: i.netWeight || (t.net ? t.net.toFixed(2) : "") }; }), autoCreateDN: !editing && fAutoCreateDN, soNo: po?.soNo || null, customerId: po?.customerId || null, customerPoNo: po?.customerPoNo || null, orderCategory: po?.orderCategory || "Bulk", userId: getUserId() }) });
    if (res.ok) { const d = await res.json(); setToast({ type: "success", text: editing ? "Updated" : `Goods Receipt created${d.dnNo ? ` + DN ${d.dnNo} auto-created` : ""}` }); setShowForm(false); load(); }
    else setToast({ type: "error", text: "Failed" });
    setSaving(false); setTimeout(() => setToast(null), 4000);
  };

  const handleDelete = async (id: number) => { if (!confirm("Delete this goods receipt?")) return; await fetch(`/api/goods-receipts?id=${id}`, { method: "DELETE" }); load(); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Goods Receipts</h1><p className="text-sm text-slate-500">{filtered.length} receipt(s)</p></div>
        <div className="flex gap-2">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search..." />
          {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New Goods Receipt</button>}
        </div>
      </div>
      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{toast.text}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-left text-slate-600">
            <th className="px-4 py-3 font-medium">GR No.</th>
            <th className="px-4 py-3 font-medium">PO Ref</th>
            <th className="px-4 py-3 font-medium">Yarn Mill</th>
            <th className="px-4 py-3 font-medium">Ship-To</th>
            <th className="px-4 py-3 font-medium text-left">Items</th>
            <th className="px-4 py-3 font-medium">GR Date</th>
            <th className="px-4 py-3 font-medium">AWB / Tracking</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {(permissions.canEdit || permissions.canDelete) && <th className="px-4 py-3 font-medium w-24">Actions</th>}
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No goods receipts</td></tr> : filtered.map(g => (
              <tr key={g.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-left"><button onClick={() => setViewing(g)} className="font-medium text-blue-700 hover:underline">{g.grNo}</button></td>
                <td className="px-4 py-3 text-xs text-slate-600">{g.poNo || "—"}</td>
                <td className="px-4 py-3 text-xs">{g.factoryName}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{g.shipToName || "—"}</td>
                <td className="px-4 py-3 text-center text-xs">{g.items.length}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{g.grDate}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{g.trackingNo || "—"}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[g.status] || "bg-slate-100 text-slate-700"}`}>{g.status}</span></td>
                {(permissions.canEdit || permissions.canDelete) && <td className="px-4 py-3"><div className="flex gap-2">{permissions.canEdit && <button onClick={() => openForm(g)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>}{permissions.canDelete && <button onClick={() => handleDelete(g.id)} className="text-red-500 hover:text-red-700 text-xs">Del</button>}</div></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Goods Receipt</h2><p className="text-xs text-slate-500 mt-0.5">{viewing.grNo}</p></div><button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><span className="text-slate-500 text-xs block">Yarn Mill</span><div className="font-medium">{viewing.factoryName}</div></div>
                <div><span className="text-slate-500 text-xs block">Ship-To</span><div className="font-medium">{viewing.shipToName || "—"}</div>{viewing.shipToContactName && <div className="text-xs text-blue-600">Attn: {viewing.shipToContactName}</div>}</div>
                <div><span className="text-slate-500 text-xs block">GR Date</span><div>{viewing.grDate}</div></div>
                <div><span className="text-slate-500 text-xs block">Status</span><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[viewing.status] || ""}`}>{viewing.status}</span></div>
              </div>
              <div className="flex gap-6 text-xs text-slate-500 flex-wrap">
                {viewing.poNo && <div>PO Ref: <span className="font-medium text-slate-700">{viewing.poNo}</span></div>}
                <div>Unit: <span className="font-semibold text-slate-700">{viewing.quantityUnit || ""}</span></div>
                {viewing.shippingMethod && <div>Shipping: <span className="font-medium text-slate-700">{viewing.shippingMethod}</span></div>}
                {viewing.trackingNo && <div>AWB / Tracking: <span className="font-medium text-slate-700">{viewing.trackingNo}</span></div>}
                {viewing.totalPackages && <div>Packages: <span className="font-medium text-slate-700">{viewing.totalPackages}</span></div>}
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm"><thead><tr className="text-left text-slate-600"><th className="px-4 py-3 font-medium">Yarn</th><th className="px-4 py-3 font-medium">Color</th><th className="px-4 py-3 font-medium">PO Qty</th><th className="px-4 py-3 font-medium">Weight</th><th className="px-4 py-3 font-medium">Total Pkgs</th><th className="px-4 py-3 font-medium">Gross Wt</th><th className="px-4 py-3 font-medium">Net Wt</th><th className="px-4 py-3 font-medium">Lot No.</th></tr></thead>
                <tbody>{viewing.items.map(i => (<tr key={i.id} className="border-t border-slate-200"><td className="px-4 py-3"><div className="font-medium">{i.yarnName}</div><div className="text-xs text-slate-400">{i.yarnCount}</div></td><td className="px-4 py-3 text-xs">{i.colorName || i.colorCode || "—"}</td><td className="px-4 py-3 text-xs text-slate-500">{i.quantityOrdered || "—"}</td><td className="px-4 py-3 text-xs font-medium">{i.quantityReceived || "—"}</td><td className="px-4 py-3 text-xs">{i.packages || "—"}</td><td className="px-4 py-3 text-xs">{i.grossWeight || "—"}</td><td className="px-4 py-3 text-xs">{i.netWeight || "—"}</td><td className="px-4 py-3 text-xs">{i.lotNo || "—"}</td></tr>))}</tbody></table>
              </div>
              {viewing.items.some(i => i.packingDetails) && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Packing Details</h3>
                  <div className="space-y-3">{viewing.items.filter(i => i.packingDetails).map(i => (<div key={i.id}><div className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-2 flex-wrap"><span>{i.yarnName}{i.colorName ? ` · ${i.colorName}` : ""}</span>{i.quantityReceived && <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">Weight: {i.quantityReceived} {viewing.quantityUnit || ""}</span>}{i.quantityOrdered && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">PO Qty: {i.quantityOrdered}</span>}</div><PackingView raw={i.packingDetails} weightUnit="" /></div>))}</div>
                </div>
              )}
              {viewing.notes && <div className="text-sm text-slate-600"><span className="text-xs text-slate-500 block mb-1">Notes</span>{viewing.notes}</div>}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <AuditInfo createdByName={viewing.createdByName} updatedByName={viewing.updatedByName} />
                {permissions.canEdit && <button onClick={() => { setViewing(null); openForm(viewing); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Edit</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? `Edit Goods Receipt — ${editing.grNo}` : "New Goods Receipt"}</h2><button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Load from Purchase Order</label>
                    <div className="flex gap-2"><select value={fPoId} onChange={e => setFPoId(Number(e.target.value))} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value={0}>— Select PO —</option>{poList.filter(p => p.status !== "Cancelled").map(p => <option key={p.id} value={p.id}>{p.poNo} — {p.factoryName}</option>)}</select><button type="button" onClick={() => loadFromPO(fPoId)} disabled={!fPoId} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 disabled:opacity-50 shrink-0">Load</button></div>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Yarn Mill *</label><select value={fFactory} onChange={e => setFFactory(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value={0}>Select...</option>{factoryList.map(f => <option key={f.id} value={f.id}>{f.factoryName}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Ship-To (Delivery Destination)</label><select value={fShipTo} onChange={e => setFShipTo(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value={0}>— None —</option>{shipToList.map(s => <option key={s.id} value={s.id}>{s.name}{s.category ? ` (${s.category})` : ""}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={fStatus} onChange={e => setFStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option>Shipped from Mill</option><option>In Transit</option><option>Arrived at Port</option><option>Customs Clearance</option><option>Delivered</option><option>Completed</option><option>On Hold</option></select></div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">GR Date *</label><input type="date" value={fGrDate} onChange={e => setFGrDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Quantity Unit</label><select value={fQtyUnit} onChange={e => setFQtyUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value="KGS">KGS</option><option value="LBS">LBS</option><option value="MTR">MTR</option><option value="YDS">YDS</option><option value="CONES">CONES</option><option value="PCS">PCS</option></select></div></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Shipping Method</label><select value={fShippingMethod} onChange={e => setFShippingMethod(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value="">— Select —</option><option>Sea Freight</option><option>Air Freight</option><option>Courier (DHL/FedEx/UPS)</option><option>Truck / Land</option><option>Rail</option><option>Ex-Works / Self Pickup</option></select></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">AWB / Tracking No.</label><input type="text" value={fTrackingNo} onChange={e => setFTrackingNo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Tracking / AWB number" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={fNotes} onChange={e => setFNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-slate-900">Items ({fItems.length})</h3><button type="button" onClick={() => setFItems(p => [...p, { ...EMPTY_ITEM }])} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300">+ Add Item</button></div>
                <div className="space-y-3">{fItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-slate-500">Item {idx + 1}</span>{fItems.length > 1 && <button type="button" onClick={() => setFItems(p => p.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:text-red-700">Remove</button>}</div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-2"><select value={item.yarnId} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, yarnId: Number(e.target.value) } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"><option value={0}>Select yarn...</option>{yarnList.map(y => <option key={y.id} value={y.id}>{y.yarnName} · {y.yarnCount || "—"} · {y.factoryName}</option>)}</select></div>
                      <div><input type="text" value={item.colorName} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, colorName: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Color Name" /></div>
                      <div><input type="text" value={item.colorCode} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, colorCode: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Color Code" /></div>
                    </div>
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      <div><input type="text" value={item.quantityOrdered} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, quantityOrdered: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="PO Qty" /></div>
                      <div><input type="text" value={item.quantityReceived} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, quantityReceived: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Cond/Net WT" /></div>
                      <div><select value={item.weightBasis} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, weightBasis: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"><option value="condition">Cond.</option><option value="net">Net</option></select></div>
                      <div><input type="text" value={item.grossWeight} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, grossWeight: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Gross Wt" /></div>
                      <div><input type="text" value={item.netWeight} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, netWeight: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Net Wt" /></div>
                      <div><input type="text" value={item.notes} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, notes: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Remarks" /></div>
                    </div>
                    <div className="mt-2">
                      <PackingEditor boxes={item.packingBoxes} onChange={(bx) => setFItems(p => p.map((l, i) => i === idx ? { ...l, packingBoxes: bx } : l))} />
                    </div>
                  </div>
                ))}</div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                {!editing && (
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={fAutoCreateDN} onChange={e => setFAutoCreateDN(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span>Auto-create Delivery Note for customer</span>
                  </label>
                )}
                {editing && <div />}
                <div className="flex gap-3">
                  <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create Goods Receipt"}</button>
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
