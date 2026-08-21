"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";
import AuditInfo from "@/components/AuditInfo";
import { IconDownload } from "@/components/Icons";
import { useYarnDetail, YarnDetailModal } from "@/components/YarnDetailModal";

interface POItem {
  id?: number;
  yarnId: number;
  yarnName?: string;
  yarnCount?: string;
  micron?: string;
  composition?: string;
  treatmentName?: string;
  colorName: string;
  colorCode: string;
  quantity: string;
  unitPrice: number;
  currency: string;
  unit: string;
  weightBasis: string;
  incoterms: string;
  notes: string;
}

interface PO {
  id: number;
  poNo: string;
  factoryId: number;
  factoryName: string;
  customerId: number;
  customerName: string;
  shipToId: number | null;
  shipToName: string | null;
  shipToContactId: number | null;
  shipToContactName: string | null;
  orderCategory: string;
  quantityUnit: string;
  paymentMethod: string | null;
  paymentDays: number | null;
  paymentReference: string | null;
  contactPerson: string;
  soNo: string;
  customerPoNo: string;
  quoteNo: string;
  currency: string;
  unit: string;
  poDate: string;
  deliveryDate: string;
  incoterms: string;
  status: string;
  notes: string;
  items: POItem[];
  totalAmount: number;
  itemCount: number;
  createdByName: string | null;
  updatedByName: string | null;
}

interface Factory { id: number; factoryName: string; relationship: string; }
interface FactoryContact { id: number; factoryId: number; contactName: string; position: string; email: string; phone: string; }
interface Customer { id: number; name: string; legitName: string; }
interface ShipTo { id: number; name: string; category: string; }
interface Yarn {
  id: number;
  yarnName: string;
  factoryName: string;
  yarnCount: string;
  micron: string;
  composition: string;
  treatmentName: string;
  latestPrice: number | null;
  latestCurrency: string | null;
  latestUnit: string | null;
  latestPrices: Array<{ price: number; currency: string; unit: string; incoterms: string; recordDate: string }>;
}
interface Props { permissions: Permissions; }
interface FormItem {
  yarnId: number;
  colorName: string;
  colorCode: string;
  quantity: string;
  unitPrice: string;
  currency: string;
  unit: string;
  weightBasis: string;
  incoterms: string;
  notes: string;
}

const STATUS_COLORS: Record<string, string> = { "In Production": "bg-amber-100 text-amber-800",
  Draft: "bg-slate-100 text-slate-700",
  Confirmed: "bg-blue-100 text-blue-800",
  Shipped: "bg-amber-100 text-amber-800",
  Received: "bg-green-100 text-green-800",
  Closed: "bg-slate-200 text-slate-600",
  Cancelled: "bg-red-100 text-red-800",
};

const EMPTY_ITEM: FormItem = {
  yarnId: 0,
  colorName: "",
  colorCode: "",
  quantity: "",
  unitPrice: "",
  currency: "USD",
  unit: "per KG",
  weightBasis: "condition",
  incoterms: "",
  notes: "",
};

export default function PurchaseOrdersPage({ permissions }: Props) {
  const [pos, setPOs] = useState<PO[]>([]);
  const [factoryList, setFactoryList] = useState<Factory[]>([]);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [shipToList, setShipToList] = useState<ShipTo[]>([]);
  const [yarnList, setYarnList] = useState<Yarn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPO, setEditingPO] = useState<PO | null>(null);
  const [viewing, setViewing] = useState<PO | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const { viewingYarn, setViewingYarn, openYarnDetail, allCerts } = useYarnDetail();

  const [fFactory, setFFactory] = useState(0);
  const [fContactPerson, setFContactPerson] = useState(0);
  const [factoryContactList, setFactoryContactList] = useState<FactoryContact[]>([]);
  const [fCustomer, setFCustomer] = useState(0);
  const [fShipTo, setFShipTo] = useState(0);
  const [fOrderCategory, setFOrderCategory] = useState("Bulk");
  const [fQtyUnit, setFQtyUnit] = useState("KGS");
  const [fPaymentMethod, setFPaymentMethod] = useState("");
  const [fPaymentDays, setFPaymentDays] = useState("");
  const [fPaymentRef, setFPaymentRef] = useState("");
  const [fSoNo, setFSoNo] = useState("");
  const [fCustomerPoNo, setFCustomerPoNo] = useState("");
  const [fQuoteNo, setFQuoteNo] = useState("");
  const [fCurrency, setFCurrency] = useState("USD");
  const [fUnit, setFUnit] = useState("per KG");
  const [fPoDate, setFPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [fDeliveryDate, setFDeliveryDate] = useState("");
  const [fIncoterms, setFIncoterms] = useState("");
  const [fStatus, setFStatus] = useState("Draft");
  const [fNotes, setFNotes] = useState("");
  const [fItems, setFItems] = useState<FormItem[]>([{ ...EMPTY_ITEM }]);

  const load = async () => {
    setLoading(true);
    const [p, f, c, st, y] = await Promise.all([
      fetch("/api/purchase-orders").then((r) => r.json()),
      fetch("/api/factories").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/ship-to-addresses").then((r) => r.json()),
      fetch("/api/yarns").then((r) => r.json()),
    ]);
    setPOs(p);
    setFactoryList(f);
    setCustomerList(c);
    setShipToList(st);
    setYarnList(y);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadFactoryContacts = async (factoryId: number) => {
    if (!factoryId) { setFactoryContactList([]); return; }
    try {
      const data = await fetch(`/api/factory-contacts?factoryId=${factoryId}`).then((r) => r.json());
      setFactoryContactList(data);
    } catch { setFactoryContactList([]); }
  };

  const filtered = useMemo(() => {
    let r = pos;
    if (statusFilter) r = r.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      r = r.filter((p) =>
        (p.poNo || "").toLowerCase().includes(s) ||
        (p.factoryName || "").toLowerCase().includes(s) ||
        (p.customerName || "").toLowerCase().includes(s) ||
        (p.customerPoNo || "").toLowerCase().includes(s) ||
        (p.soNo || "").toLowerCase().includes(s) ||
        p.items.some((i) =>
          (i.yarnName || "").toLowerCase().includes(s) ||
          (i.colorName || "").toLowerCase().includes(s) ||
          (i.colorCode || "").toLowerCase().includes(s)
        )
      );
    }
    return r;
  }, [pos, statusFilter, search]);

  const openForm = (po?: PO) => {
    if (po) {
      setEditingPO(po);
      setFFactory(po.factoryId);
      if (po.factoryId) loadFactoryContacts(po.factoryId);
      setFContactPerson(0);
      setFCustomer(po.customerId || 0);
      setFShipTo(po.shipToId || 0);
      setFOrderCategory(po.orderCategory || "Bulk");
      setFQtyUnit(po.quantityUnit || "KGS");
      setFQtyUnit(po.quantityUnit || "KGS");
      setFPaymentMethod(po.paymentMethod || "");
      setFPaymentDays(po.paymentDays ? String(po.paymentDays) : "");
      setFPaymentRef(po.paymentReference || "");
      setFSoNo(po.soNo || "");
      setFCustomerPoNo(po.customerPoNo || "");
      setFQuoteNo(po.quoteNo || "");
      setFCurrency(po.currency || "USD");
      setFUnit(po.unit || "per KG");
      setFPoDate(po.poDate);
      setFDeliveryDate(po.deliveryDate || "");
      setFIncoterms(po.incoterms || "");
      setFStatus(po.status || "Draft");
      setFNotes(po.notes || "");
      setFItems(
        po.items.map((i) => ({
          yarnId: i.yarnId,
          colorName: i.colorName || "",
          colorCode: i.colorCode || "",
          quantity: i.quantity || "",
          unitPrice: String(i.unitPrice),
          currency: i.currency || "USD",
          unit: i.unit || "per KG",
          weightBasis: i.weightBasis || "condition",
          incoterms: i.incoterms || "",
          notes: i.notes || "",
        }))
      );
    } else {
      setEditingPO(null);
      setFFactory(0);
      setFCustomer(0);
      setFShipTo(0);
      setFOrderCategory("Bulk");
      setFQtyUnit("KGS");
      setFQtyUnit("KGS");
      setFPaymentMethod("");
      setFPaymentDays("");
      setFPaymentRef("");
      setFContactPerson(0);
      setFactoryContactList([]);
      setFSoNo("");
      setFCustomerPoNo("");
      setFQuoteNo("");
      setFCurrency("USD");
      setFUnit("per KG");
      setFPoDate(new Date().toISOString().split("T")[0]);
      setFDeliveryDate("");
      setFIncoterms("");
      setFStatus("Draft");
      setFNotes("");
      setFItems([{ ...EMPTY_ITEM }]);
    }
    setShowForm(true);
  };

  const updateItem = (idx: number, field: keyof FormItem, value: string) =>
    setFItems((p) => p.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));

  const copyItem = (idx: number) => {
    setFItems((prev) => {
      const copy = { ...prev[idx], colorName: "", colorCode: "", notes: "" };
      const n = [...prev];
      n.splice(idx + 1, 0, copy);
      return n;
    });
  };

  const validItemCount = fItems.filter((i) => i.yarnId && i.unitPrice).length;

  const handleSubmit = async () => {
    if (!fFactory || !fPoDate) {
      setToast({ type: "error", text: "Yarn mill and PO date are required" });
      return;
    }
    const validItems = fItems.filter((i) => i.yarnId && i.unitPrice);
    if (validItems.length === 0) {
      setToast({ type: "error", text: "Add at least one item" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPO?.id,
          poNo: editingPO?.poNo,
          factoryId: fFactory,
          customerId: fCustomer || null,
          shipToId: fShipTo || null,
          orderCategory: fOrderCategory,
          quantityUnit: fQtyUnit,
          paymentMethod: fPaymentMethod || null,
          paymentDays: fPaymentDays ? parseInt(fPaymentDays) : null,
          paymentReference: fPaymentRef || null,
          contactPerson: fContactPerson ? (factoryContactList.find((c) => c.id === fContactPerson)?.contactName || null) : null,
          soNo: fSoNo,
          customerPoNo: fCustomerPoNo,
          quoteNo: fQuoteNo,
          currency: fCurrency,
          unit: fUnit,
          poDate: fPoDate,
          deliveryDate: fDeliveryDate,
          incoterms: fIncoterms,
          status: fStatus,
          notes: fNotes,
          items: validItems,
          userId: getUserId(),
        }),
      });

      if (res.ok) {
        const d = await res.json();
        setToast({ type: "success", text: `${editingPO ? "Updated" : "Created"} PO ${d.poNo || ""}` });
        setShowForm(false);
        load();
      } else {
        const d = await res.json().catch(() => ({ error: "Failed" }));
        setToast({ type: "error", text: d.error || "Failed" });
      }
    } catch {
      setToast({ type: "error", text: "Connection error" });
    }
    setSaving(false);
    setTimeout(() => setToast(null), 4000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this purchase order?")) return;
    await fetch(`/api/purchase-orders?id=${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-sm text-slate-500">{filtered.length} order(s)</p>
        </div>
        {permissions.canEdit && (
          <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + New PO
          </button>
        )}
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search PO, SO, customer PO, yarn mill, color..."
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          <option value="">All Status</option>
          <option>Draft</option>
          <option>Confirmed</option>
          <option>In Production</option>
          <option>Shipped</option>
          <option>Delivered</option>
          <option>Closed</option>
          <option>Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3 font-medium">PO No.</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Yarn Mill</th>
              <th className="px-4 py-3 font-medium">Customer PO</th>
              <th className="px-4 py-3 font-medium">SO Ref</th>
              <th className="px-4 py-3 font-medium text-left">Items</th>
              <th className="px-4 py-3 font-medium">PO Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No purchase orders</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3"><button onClick={() => setViewing(p)} className="font-medium text-blue-700 hover:underline">{p.poNo}</button></td>
                <td className="px-4 py-3">
                  {p.orderCategory && p.orderCategory !== "Bulk" ? (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.orderCategory === "Sample" ? "bg-purple-100 text-purple-700" : p.orderCategory === "Free of Charge" ? "bg-amber-100 text-amber-700" : "bg-cyan-100 text-cyan-700"}`}>{p.orderCategory}</span>
                  ) : (
                    <span className="text-xs text-slate-400">Bulk</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">{p.factoryName || "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{p.customerPoNo || "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{p.soNo || "—"}</td>
                <td className="px-4 py-3 text-center text-xs">{p.itemCount}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{p.poDate}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[p.status] || "bg-slate-100 text-slate-700"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    
                    <a href={`/api/export/po?id=${p.id}`} className="text-slate-600 hover:text-slate-900 text-xs inline-flex items-center gap-1">
                      <IconDownload className="w-3 h-3" />Export
                    </a>
                    {permissions.canEdit && <button onClick={() => openForm(p)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>}
                    {permissions.canDelete && <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs">Del</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Purchase Order Detail</h2>
                <p className="text-xs text-slate-500 mt-0.5">{viewing.poNo}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><span className="text-slate-500 text-xs block">Yarn Mill</span><div className="font-medium">{viewing.factoryName || "—"}</div></div>
                <div><span className="text-slate-500 text-xs block">Customer</span><div className="font-medium">{viewing.customerName || "—"}</div></div>
                <div>
                  <span className="text-slate-500 text-xs block">Ship-To</span>
                  <div className="font-medium">{viewing.shipToName || "—"}</div>
                  {viewing.shipToContactName && <div className="text-xs text-blue-600 mt-0.5">Attn: {viewing.shipToContactName}</div>}
                </div>
                <div><span className="text-slate-500 text-xs block">Status</span><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[viewing.status] || ""}`}>{viewing.status}</span></div>
              </div>

              <div className="flex gap-6 text-xs text-slate-500 flex-wrap">
                <div>Category: <span className={`font-semibold ${{Sample:"text-purple-600","Free of Charge":"text-amber-600","Lab Dip":"text-cyan-600","Strike Off":"text-cyan-600"}[viewing.orderCategory||""] || "text-slate-700"}`}>{viewing.orderCategory || "Bulk"}</span></div>
                {viewing.paymentMethod && <div>Payment: <span className="font-semibold text-emerald-700">{viewing.paymentMethod}{viewing.paymentDays ? ` ${viewing.paymentDays} Days` : ""}{viewing.paymentReference ? ` from ${viewing.paymentReference}` : ""}</span></div>}
                <div>Unit: <span className="font-semibold text-slate-700">{viewing.quantityUnit || "KGS"}</span></div>
                <div>PO Date: <span className="font-medium text-slate-700">{viewing.poDate}</span></div>
                {viewing.customerPoNo && <div>Customer PO: <span className="font-medium text-slate-700">{viewing.customerPoNo}</span></div>}
                {viewing.soNo && <div>SO Ref: <span className="font-medium text-slate-700">{viewing.soNo}</span></div>}
                {viewing.quoteNo && <div>Quote Ref: <span className="font-medium text-slate-700">{viewing.quoteNo}</span></div>}
                {viewing.deliveryDate && <div>Delivery: <span className="font-medium text-slate-700">{viewing.deliveryDate}</span></div>}
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600">
                      <th className="px-4 py-3 font-medium">Yarn</th>
                      <th className="px-4 py-3 font-medium">Composition</th>
                      <th className="px-4 py-3 font-medium">Color</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                      <th className="px-4 py-3 font-medium">Weight</th>
                      <th className="px-4 py-3 font-medium">Incoterms</th>
                      <th className="px-4 py-3 font-medium">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewing.items.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200">
                        <td className="px-4 py-3">
                          <button onClick={() => openYarnDetail(item.yarnId)} className="font-medium text-blue-700 hover:underline text-left">
                            {item.yarnName || "—"}
                          </button>
                          <div className="text-[10px] text-slate-400">{item.yarnCount || ""}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">{item.composition || "—"}</td>
                        <td className="px-4 py-3 text-xs">
                          {item.colorName || item.colorCode ? (
                            <>
                              <div className="font-medium">{item.colorName || "—"}</div>
                              {item.colorCode && <div className="text-slate-400">{item.colorCode}</div>}
                            </>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">{item.quantity || "—"}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {item.currency} {item.unitPrice.toFixed(2)}
                          <span className="text-slate-400">/{(item.unit || "per KG").replace("per ", "")}</span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {item.weightBasis === "net" ? (
                            <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded font-medium border border-orange-200">Net</span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium border border-green-200">Cond.</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">{item.incoterms || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] whitespace-pre-line">{item.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {viewing.notes && (
                <div className="border-t border-slate-200 pt-3">
                  <span className="text-slate-500 text-xs block mb-1">PO Remarks</span>
                  <div className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded-lg p-3">{viewing.notes}</div>
                </div>
              )}

              <AuditInfo createdByName={viewing.createdByName} updatedByName={viewing.updatedByName} className="border-t border-slate-200 pt-3" />
              <div className="pt-2 flex gap-2 flex-wrap">
                {permissions.canEdit && viewing.status === "Confirmed" && (
                  <button onClick={async () => {
                    const res = await fetch("/api/purchase-orders", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: viewing.id, status: "In Production", factoryId: viewing.factoryId, poDate: viewing.poDate, poNo: viewing.poNo, items: viewing.items.map(i => ({ yarnId: i.yarnId, colorName: i.colorName, colorCode: i.colorCode, quantity: i.quantity, unitPrice: String(i.unitPrice), currency: i.currency, unit: i.unit, weightBasis: i.weightBasis, incoterms: i.incoterms, notes: i.notes })), userId: getUserId() }),
                    });
                    if (res.ok) { setToast({ type: "success", text: "PO set to In Production (SO synced)" }); setViewing(null); load(); }
                    else setToast({ type: "error", text: "Failed" });
                    setTimeout(() => setToast(null), 3000);
                  }} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700">▶ Start Production</button>
                )}
                <a href={`/api/export/po?id=${viewing.id}`} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 inline-flex items-center gap-1.5">
                  <IconDownload className="w-3.5 h-3.5" /> Export PO
                </a>
                {permissions.canEdit && (
                  <button onClick={() => { setViewing(null); openForm(viewing); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                    Edit PO
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{editingPO ? "Edit Purchase Order" : "New Purchase Order"}</h2>
                {editingPO && <p className="text-xs text-slate-500 mt-0.5">{editingPO.poNo}</p>}
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Yarn Mill *</label>
                    <select value={fFactory} onChange={(e) => { const v = Number(e.target.value); setFFactory(v); setFContactPerson(0); loadFactoryContacts(v); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                      <option value={0}>Select...</option>
                      {factoryList.map((f) => (
                        <option key={f.id} value={f.id}>{f.factoryName} ({f.relationship === "My Factory" ? "Mine" : "Competitor"})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person (at Yarn Mill)</label>
                    <select value={fContactPerson} onChange={(e) => setFContactPerson(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" disabled={!fFactory}>
                      <option value={0}>{fFactory ? (factoryContactList.length > 0 ? "— Select contact —" : "— No contacts —") : "Select yarn mill first"}</option>
                      {factoryContactList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.contactName}{c.position ? ` · ${c.position}` : ""}{c.email ? ` · ${c.email}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                    <select value={fCustomer} onChange={(e) => setFCustomer(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                      <option value={0}>None</option>
                      {customerList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Order Category</label>
                      <select value={fOrderCategory} onChange={(e) => setFOrderCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                        <option value="Bulk">Bulk</option>
                        <option value="Sample">Sample</option>
                        <option value="Free of Charge">Free of Charge</option>
                        <option value="Lab Dip">Lab Dip</option>
                        <option value="Strike Off">Strike Off</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Order Unit</label>
                      <select value={fQtyUnit} onChange={(e) => setFQtyUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value="KGS">KGS</option><option value="LBS">LBS</option><option value="MTR">MTR</option><option value="YDS">YDS</option><option value="CONES">CONES</option><option value="PCS">PCS</option></select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                      <option>Draft</option>
                      <option>Confirmed</option>
                      <option>In Production</option>
                      <option>Shipped</option>
                      <option>Delivered</option>
                      <option>Closed</option>
                      <option>Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ship-To Destination</label>
                    <select value={fShipTo} onChange={(e) => setFShipTo(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                      <option value={0}>— None —</option>
                      {shipToList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}{s.category ? ` (${s.category})` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">PO Date *</label>
                      <input type="date" value={fPoDate} onChange={(e) => setFPoDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Date</label>
                      <input type="date" value={fDeliveryDate} onChange={(e) => setFDeliveryDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Customer PO No.</label>
                      <input type="text" value={fCustomerPoNo} onChange={(e) => setFCustomerPoNo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">SO Ref No.</label>
                      <input type="text" value={fSoNo} onChange={(e) => setFSoNo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Term (Us → Yarn Mill)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select value={fPaymentMethod} onChange={(e) => setFPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                        <option value="">— None —</option>
                        <option value="OA">OA</option>
                        <option value="TT">TT</option>
                        <option value="LC">LC</option>
                        <option value="DP">DP</option>
                        <option value="DA">DA</option>
                        <option value="CAD">CAD</option>
                        <option value="Advance">Advance</option>
                      </select>
                      <input type="number" value={fPaymentDays} onChange={(e) => setFPaymentDays(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Days" min="0" />
                      <select value={fPaymentRef} onChange={(e) => setFPaymentRef(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                        <option value="">From...</option>
                        <option value="Invoice Date">Invoice Date</option>
                        <option value="BL Date">BL Date</option>
                        <option value="Shipment Date">Shipment</option>
                        <option value="Delivery Date">Delivery</option>
                        <option value="Before Shipment">Before Ship.</option>
                        <option value="At Sight">At Sight</option>
                      </select>
                    </div>
                    {fPaymentMethod && <div className="mt-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium border border-emerald-200">{fPaymentMethod}{fPaymentDays ? ` ${fPaymentDays} Days` : ""}{fPaymentRef ? ` from ${fPaymentRef}` : ""}</div>}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Items ({fItems.length})</h3>
                  <button type="button" onClick={() => setFItems((p) => [...p, { ...EMPTY_ITEM }])} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300">
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {fItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500">Item {idx + 1}</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => copyItem(idx)} className="text-xs text-emerald-600 hover:text-emerald-800">Copy</button>
                          {fItems.length > 1 && (
                            <button type="button" onClick={() => setFItems((p) => p.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:text-red-700">
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-2">
                          <select value={item.yarnId} onChange={(e) => updateItem(idx, "yarnId", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs">
                            <option value={0}>Select yarn...</option>
                            {yarnList.map((y) => (
                              <option key={y.id} value={y.id}>
                                {y.yarnName} · {y.yarnCount || "—"} · {y.factoryName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <input type="text" value={item.colorName} onChange={(e) => updateItem(idx, "colorName", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Color Name" />
                        </div>
                        <div>
                          <input type="text" value={item.colorCode} onChange={(e) => updateItem(idx, "colorCode", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Color Code" />
                        </div>
                      </div>

                      <div className="grid grid-cols-6 gap-2 mt-2">
                        <div>
                          <input type="text" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Qty" />
                        </div>
                        <div>
                          <input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Cost Price" />
                        </div>
                        <div>
                          <select value={item.currency} onChange={(e) => updateItem(idx, "currency", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
                            <option>USD</option>
                            <option>EUR</option>
                            <option>GBP</option>
                            <option>CNY</option>
                            <option>JPY</option>
                          </select>
                        </div>
                        <div>
                          <select value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
                            <option>per KG</option>
                            <option>per LB</option>
                            <option>per Cone</option>
                          </select>
                        </div>
                        <div>
                          <select value={item.weightBasis} onChange={(e) => updateItem(idx, "weightBasis", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
                            <option value="condition">Cond.</option>
                            <option value="net">Net</option>
                          </select>
                        </div>
                        <div>
                          <input type="text" value={item.incoterms} onChange={(e) => updateItem(idx, "incoterms", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Incoterms" />
                        </div>
                      </div>

                      <div className="mt-2">
                        <input type="text" value={item.notes} onChange={(e) => updateItem(idx, "notes", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs" placeholder="Remarks (optional)" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PO Remarks</label>
                <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} />
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-200">
                <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : `${editingPO ? "Update" : "Create"} PO (${validItemCount} items)`}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingYarn && <YarnDetailModal yarn={viewingYarn} certs={allCerts} onClose={() => setViewingYarn(null)} />}
    </div>
  );
}