"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";
import AuditInfo from "@/components/AuditInfo";
import { PackingEditor, PackingView, parsePacking, serializePacking, packingTotals, type PackingBox } from "@/components/PackingEditor";
import { IconDownload } from "@/components/Icons"; // 🆕 已經有引入，太棒了

interface DNItem { id: number; dnId: number; yarnId: number; yarnName: string; yarnCount: string; composition: string; factoryName: string; colorName: string; colorCode: string; quantity: string; weightBasis: string; packages: number; packingDetails: string; grossWeight: string; netWeight: string; lotNo: string; notes: string; }
interface DN { id: number; dnNo: string; soId: number | null; soNo: string; customerPoNo: string | null; customerId: number; customerName: string; contactName: string | null; shipToId: number | null; shipToName: string | null; shipToContactName: string | null; orderCategory: string; quantityUnit: string; dnDate: string; shippingMethod: string; trackingNo: string; totalPackages: number; totalGrossWeight: string; totalNetWeight: string; status: string; notes: string; items: DNItem[]; createdByName: string | null; updatedByName: string | null; }
interface Customer { id: number; name: string; country?: string | null; } // 🆕 加上 country 以利判斷語言
interface ShipTo { id: number; name: string; category: string; }
interface Yarn { id: number; yarnName: string; factoryName: string; yarnCount: string; }
interface FormItem { yarnId: number; colorName: string; colorCode: string; quantity: string; weightBasis: string; packingBoxes: PackingBox[]; grossWeight: string; netWeight: string; lotNo: string; notes: string; }
interface Props { permissions: Permissions; }

const STATUS_COLORS: Record<string, string> = { Draft: "bg-slate-100 text-slate-700", Packed: "bg-blue-100 text-blue-800", Shipped: "bg-amber-100 text-amber-800", Delivered: "bg-green-100 text-green-800", Cancelled: "bg-red-100 text-red-800" };
const EMPTY_ITEM: FormItem = { yarnId: 0, colorName: "", colorCode: "", quantity: "", weightBasis: "condition", packingBoxes: [], grossWeight: "", netWeight: "", lotNo: "", notes: "" };

export default function DeliveryNotesPage({ permissions }: Props) {
  const [dns, setDns] = useState<DN[]>([]);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [shipToList, setShipToList] = useState<ShipTo[]>([]);
  const [yarnList, setYarnList] = useState<Yarn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DN | null>(null);
  const [viewing, setViewing] = useState<DN | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [fCustomer, setFCustomer] = useState(0);
  const [fShipTo, setFShipTo] = useState(0);
  const [fCategory, setFCategory] = useState("Bulk");
  const [fQtyUnit, setFQtyUnit] = useState("KGS");
  const [fCustomerPoNo, setFCustomerPoNo] = useState("");
  const [fSoNo, setFSoNo] = useState("");
  const [fDnDate, setFDnDate] = useState(new Date().toISOString().split("T")[0]);
  const [fShippingMethod, setFShippingMethod] = useState("");
  const [fTrackingNo, setFTrackingNo] = useState("");
  const [fStatus, setFStatus] = useState("Draft");
  const [fNotes, setFNotes] = useState("");
  const [fItems, setFItems] = useState<FormItem[]>([{ ...EMPTY_ITEM }]);

  const load = async () => {
    setLoading(true);
    const [d, c, st, y] = await Promise.all([
      fetch("/api/delivery-notes").then(r => r.json()),
      fetch("/api/customers").then(r => r.json()),
      fetch("/api/ship-to-addresses").then(r => r.json()),
      fetch("/api/yarns").then(r => r.json()),
    ]);
    setDns(d); setCustomerList(c); setShipToList(st); setYarnList(y); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // 🆕 全域搜尋跳轉監聽
  useEffect(() => {
    const handleAutoOpen = () => {
      const targetPage = sessionStorage.getItem("scanTargetPage");
      const targetId = sessionStorage.getItem("scanTargetId");
      if (targetPage === "delivery-notes" && targetId && dns.length > 0) {
        const match = dns.find((d) => d.id === Number(targetId));
        if (match) setViewing(match);
        sessionStorage.removeItem("scanTargetPage");
        sessionStorage.removeItem("scanTargetId");
      }
    };
    window.addEventListener("fib-navigate", handleAutoOpen);
    handleAutoOpen();
    return () => window.removeEventListener("fib-navigate", handleAutoOpen);
  }, [dns]);

  const filtered = useMemo(() => {
    if (!search.trim()) return dns;
    const s = search.toLowerCase();
    return dns.filter(d =>
      d.dnNo?.toLowerCase().includes(s) ||
      d.customerName?.toLowerCase().includes(s) ||
      (d.customerPoNo || "").toLowerCase().includes(s) ||
      d.soNo?.toLowerCase().includes(s) ||
      d.trackingNo?.toLowerCase().includes(s)
    );
  }, [dns, search]);

  const openForm = (dn?: DN) => {
    if (dn) {
      setEditing(dn);
      setFCustomer(dn.customerId);
      setFShipTo(dn.shipToId || 0);
      setFCategory(dn.orderCategory || "Bulk");
      setFQtyUnit(dn.quantityUnit || "KGS");
      setFCustomerPoNo(dn.customerPoNo || "");
      setFSoNo(dn.soNo || "");
      setFDnDate(dn.dnDate);
      setFShippingMethod(dn.shippingMethod || "");
      setFTrackingNo(dn.trackingNo || "");
      setFStatus(dn.status || "Draft");
      setFNotes(dn.notes || "");
      setFItems(dn.items.map(i => ({ yarnId: i.yarnId, colorName: i.colorName || "", colorCode: i.colorCode || "", quantity: i.quantity || "", weightBasis: i.weightBasis || "condition", packingBoxes: parsePacking(i.packingDetails), grossWeight: i.grossWeight || "", netWeight: i.netWeight || "", lotNo: i.lotNo || "", notes: i.notes || "" })));
    } else {
      setEditing(null);
      setFCustomer(0);
      setFShipTo(0);
      setFCategory("Bulk");
      setFQtyUnit("KGS");
      setFCustomerPoNo("");
      setFSoNo("");
      setFDnDate(new Date().toISOString().split("T")[0]);
      setFShippingMethod("");
      setFTrackingNo("");
      setFStatus("Draft");
      setFNotes("");
      setFItems([{ ...EMPTY_ITEM }]);
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!fCustomer) { setToast({ type: "error", text: "Select a customer" }); return; }
    const validItems = fItems.filter(i => i.yarnId);
    if (!validItems.length) { setToast({ type: "error", text: "Add at least one item" }); return; }
    setSaving(true);
    const res = await fetch("/api/delivery-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing?.id,
        soNo: fSoNo || null,
        customerPoNo: fCustomerPoNo || null,
        customerId: fCustomer,
        shipToId: fShipTo || null,
        orderCategory: fCategory,
        quantityUnit: fQtyUnit,
        dnDate: fDnDate,
        shippingMethod: fShippingMethod,
        trackingNo: fTrackingNo,
        status: fStatus,
        notes: fNotes,
        items: validItems.map(i => { const t = packingTotals(i.packingBoxes); return { ...i, packages: t.count || null, packingDetails: serializePacking(i.packingBoxes), grossWeight: i.grossWeight || (t.gross ? t.gross.toFixed(2) : ""), netWeight: i.netWeight || (t.net ? t.net.toFixed(2) : "") }; }),
        userId: getUserId(),
      }),
    });
    if (res.ok) { setToast({ type: "success", text: editing ? "Updated" : "Delivery Note created" }); setShowForm(false); load(); }
    else setToast({ type: "error", text: "Failed" });
    setSaving(false); setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => { if (!confirm("Delete this delivery note?")) return; await fetch(`/api/delivery-notes?id=${id}`, { method: "DELETE" }); load(); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#d97449] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Delivery Notes</h1><p className="text-sm text-slate-500">{filtered.length} note(s)</p></div>
        <div className="flex gap-2">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f1c6b2]" placeholder="Search..." />
          {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-[#d97449] hover:bg-[#b7492f] text-white rounded-lg text-sm font-semibold transition-colors">+ New Delivery Note</button>}
        </div>
      </div>
      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{toast.text}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-left text-slate-600">
            <th className="px-4 py-3 font-medium">DN No.</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Client PO</th>
            <th className="px-4 py-3 font-medium">SO Ref</th>
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Ship-To</th>
            <th className="px-4 py-3 font-medium text-left">Items</th>
            <th className="px-4 py-3 font-medium">DN Date</th>
            <th className="px-4 py-3 font-medium">Tracking</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {(permissions.canEdit || permissions.canDelete) && <th className="px-4 py-3 font-medium w-32">Actions</th>}
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-400">No delivery notes</td></tr> : filtered.map(d => (
              <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-left"><button onClick={() => setViewing(d)} className="font-medium text-[#d97449] hover:underline">{d.dnNo}</button></td>
                <td className="px-4 py-3">{d.orderCategory !== "Bulk" ? <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${d.orderCategory === "Sample" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"}`}>{d.orderCategory}</span> : <span className="text-xs text-slate-400">Bulk</span>}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{d.customerPoNo || "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{d.soNo || "—"}</td>
                <td className="px-4 py-3 text-xs">{d.customerName}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{d.shipToName || "—"}</td>
                <td className="px-4 py-3 text-center text-xs">{d.items.length}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{d.dnDate}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{d.trackingNo || "—"}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[d.status] || "bg-slate-100 text-slate-700"}`}>{d.status}</span></td>
                {(permissions.canEdit || permissions.canDelete) && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap items-center">
                      {/* 🆕 加入匯出按鈕 */}
                      <a href={`/api/export/excel?type=dn&id=${d.id}`} className="text-slate-600 hover:text-slate-900 text-xs inline-flex items-center gap-1 font-medium">
                        <IconDownload className="w-3.5 h-3.5" />Export
                      </a>
                      {permissions.canEdit && <button onClick={() => openForm(d)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>}
                      {permissions.canDelete && <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-700 text-xs">Del</button>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Delivery Note</h2><p className="text-xs text-slate-500 mt-0.5">{viewing.dnNo}</p></div><button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><span className="text-slate-500 text-xs block">Client</span><div className="font-medium">{viewing.customerName}</div>{viewing.contactName && <div className="text-xs text-blue-600">Attn: {viewing.contactName}</div>}</div>
                <div><span className="text-slate-500 text-xs block">Ship-To</span><div className="font-medium">{viewing.shipToName || "—"}</div>{viewing.shipToContactName && <div className="text-xs text-blue-600">Attn: {viewing.shipToContactName}</div>}</div>
                <div><span className="text-slate-500 text-xs block">DN Date</span><div>{viewing.dnDate}</div></div>
                <div><span className="text-slate-500 text-xs block">Status</span><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[viewing.status] || ""}`}>{viewing.status}</span></div>
              </div>
              <div className="flex gap-6 text-xs text-slate-500 flex-wrap">
                {viewing.customerPoNo && <div>Client PO: <span className="font-medium text-slate-700">{viewing.customerPoNo}</span></div>}
                <div>Unit: <span className="font-semibold text-slate-700">{viewing.quantityUnit || "KGS"}</span></div>
                {viewing.soNo && <div>SO Ref: <span className="font-medium text-slate-700">{viewing.soNo}</span></div>}
                {viewing.shippingMethod && <div>Shipping: <span className="font-medium text-slate-700">{viewing.shippingMethod}</span></div>}
                {viewing.trackingNo && <div>Tracking: <span className="font-medium text-slate-700">{viewing.trackingNo}</span></div>}
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm"><thead><tr className="text-left text-slate-600"><th className="px-4 py-3 font-medium">Yarn</th><th className="px-4 py-3 font-medium">Color</th><th className="px-4 py-3 font-medium">Invoice Qty</th><th className="px-4 py-3 font-medium">Wt Basis</th><th className="px-4 py-3 font-medium">Total Pkgs</th><th className="px-4 py-3 font-medium">Gross Wt</th><th className="px-4 py-3 font-medium">Net Wt</th><th className="px-4 py-3 font-medium">Lot No.</th></tr></thead>
                <tbody>{viewing.items.map(i => (<tr key={i.id} className="border-t border-slate-200"><td className="px-4 py-3"><div className="font-medium">{i.yarnName}</div><div className="text-xs text-slate-400">{i.yarnCount} · {i.factoryName}</div></td><td className="px-4 py-3 text-xs">{i.colorName || i.colorCode || "—"}</td><td className="px-4 py-3 text-xs">{i.quantity || "—"}</td><td className="px-4 py-3 text-xs">{i.weightBasis === "net" ? <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-medium">Net</span> : <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-medium">Cond.</span>}</td><td className="px-4 py-3 text-xs">{i.packages || "—"}</td><td className="px-4 py-3 text-xs">{i.grossWeight || "—"}</td><td className="px-4 py-3 text-xs">{i.netWeight || "—"}</td><td className="px-4 py-3 text-xs">{i.lotNo || "—"}</td></tr>))}</tbody></table>
              </div>
              {viewing.items.some(i => i.packingDetails) && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Packing Details</h3>
                  <div className="space-y-3">{viewing.items.filter(i => i.packingDetails).map(i => (<div key={i.id}><div className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-2 flex-wrap"><span>{i.yarnName}{i.colorName ? ` · ${i.colorName}` : ""}</span>{i.quantity && <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">Invoice Qty: {i.quantity} {viewing.quantityUnit || "KGS"}</span>}</div><PackingView raw={i.packingDetails} weightUnit="" /></div>))}</div>
                </div>
              )}
              {viewing.notes && <div className="text-sm text-slate-600"><span className="text-xs text-slate-500 block mb-1">Notes</span>{viewing.notes}</div>}
              
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <AuditInfo createdByName={viewing.createdByName} updatedByName={viewing.updatedByName} />
                <div className="flex gap-2">
                  {/* 🆕 彈窗底部加入匯出按鈕 */}
                  <a href={`/api/export/excel?type=dn&id=${viewing.id}`} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 inline-flex items-center gap-1.5">
                    <IconDownload className="w-3.5 h-3.5" /> Export DN
                  </a>
                  {permissions.canEdit && <button onClick={() => { setViewing(null); openForm(viewing); }} className="px-3 py-1.5 bg-[#d97449] text-white rounded-lg text-xs font-semibold hover:bg-[#b7492f]">Edit</button>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? `Edit Delivery Note — ${editing.dnNo}` : "New Delivery Note"}</h2><button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Client *</label><select value={fCustomer} onChange={e => setFCustomer(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"><option value={0}>Select...</option>{customerList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Client PO No.</label><input type="text" value={fCustomerPoNo} onChange={e => setFCustomerPoNo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">SO Ref No.</label><input type="text" value={fSoNo} onChange={e => setFSoNo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Order Category</label><select value={fCategory} onChange={e => setFCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"><option value="Bulk">Bulk</option><option value="Sample">Sample</option><option value="Free of Charge">Free of Charge</option><option value="Lab Dip">Lab Dip</option><option value="Strike Off">Strike Off</option></select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={fStatus} onChange={e => setFStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"><option>Draft</option><option>Packed</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></div>
                </div>
                <div className="space-y-3">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Ship-To Destination</label><select value={fShipTo} onChange={e => setFShipTo(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"><option value={0}>— None —</option>{shipToList.map(s => <option key={s.id} value={s.id}>{s.name}{s.category ? ` (${s.category})` : ""}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">DN Date *</label><input type="date" value={fDnDate} onChange={e => setFDnDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Quantity Unit</label><select value={fQtyUnit} onChange={e => setFQtyUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"><option value="KGS">KGS</option><option value="LBS">LBS</option><option value="MTR">MTR</option><option value="YDS">YDS</option><option value="CONES">CONES</option><option value="PCS">PCS</option></select></div></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Shipping Method</label><input type="text" value={fShippingMethod} onChange={e => setFShippingMethod(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Sea, Air, Courier" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Tracking No.</label><input type="text" value={fTrackingNo} onChange={e => setFTrackingNo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                  </div>
                  
                  {/* 🆕 智能 Template 讀取，自動判斷中/英文 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-700">Notes</label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          onChange={async (e) => {
                            if (e.target.checked) {
                              try {
                                const res = await fetch("/api/system-settings");
                                if (res.ok) {
                                  const settings = await res.json();
                                  
                                  const currentClient = customerList.find(c => c.id === fCustomer);
                                  const cStr = (currentClient?.country || "").toLowerCase();
                                  const isChina = cStr.includes("china") || cStr.includes("cn") || 
                                                  cStr.includes("中國") || cStr.includes("中国");
                                                  
                                  const targetKey = isChina ? "template_dn_remarks_zh" : "template_dn_remarks_en";
                                  let template = settings.find((s: any) => s.key === targetKey);
                                  
                                  if (!template?.value) {
                                    template = settings.find((s: any) => s.key === "template_dn_remarks");
                                  }

                                  if (template?.value) {
                                    setFNotes((prev) => prev ? `${prev}\n\n${template.value}` : template.value);
                                  }
                                }
                              } catch {}
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#d97449] focus:ring-[#f1c6b2]"
                        />
                        Load template
                      </label>
                    </div>
                    <textarea value={fNotes} onChange={e => setFNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} placeholder="Enter delivery remarks here..." />
                  </div>
                  
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-slate-900">Items ({fItems.length})</h3><button type="button" onClick={() => setFItems(p => [...p, { ...EMPTY_ITEM }])} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300">+ Add Item</button></div>
                <div className="space-y-3">{fItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-slate-500">Item {idx + 1}</span>{fItems.length > 1 && <button type="button" onClick={() => setFItems(p => p.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>}</div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-2"><select value={item.yarnId} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, yarnId: Number(e.target.value) } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"><option value={0}>Select yarn...</option>{yarnList.map(y => <option key={y.id} value={y.id}>{y.yarnName} · {y.yarnCount || "—"} · {y.factoryName}</option>)}</select></div>
                      <div><input type="text" value={item.colorName} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, colorName: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Color Name" /></div>
                      <div><input type="text" value={item.colorCode} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, colorCode: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Color Code" /></div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      <div><input type="text" value={item.quantity} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, quantity: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50" placeholder="Invoice Qty" /></div>
                      <div><input type="text" value={item.grossWeight} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, grossWeight: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Gross Wt" /></div>
                      <div><input type="text" value={item.netWeight} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, netWeight: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Net Wt" /></div>
                      <div><input type="text" value={item.lotNo} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, lotNo: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Lot No." /></div>
                    </div>
                    <div className="mt-2">
                      <div className="text-[11px] text-slate-500 mb-1">Invoice Qty: <span className="font-semibold text-slate-700">{item.quantity || "—"} {fQtyUnit}</span></div>
                      <PackingEditor boxes={item.packingBoxes} onChange={(bx) => setFItems(p => p.map((l, i) => i === idx ? { ...l, packingBoxes: bx } : l))} />
                    </div>
                    <div className="mt-2"><input type="text" value={item.notes} onChange={e => setFItems(p => p.map((l, i) => i === idx ? { ...l, notes: e.target.value } : l))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Remarks for this item" /></div>
                  </div>
                ))}</div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end gap-3">
                <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 bg-[#d97449] hover:bg-[#b7492f] text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">{saving ? "Saving..." : editing ? "Update Delivery Note" : "Create Delivery Note"}</button>
                <button onClick={() => setShowForm(false)} className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}