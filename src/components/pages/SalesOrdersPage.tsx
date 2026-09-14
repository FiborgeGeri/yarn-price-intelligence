"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";
import AuditInfo from "@/components/AuditInfo";
import { useYarnDetail, YarnDetailModal } from "@/components/YarnDetailModal";
import IncotermsInput from "@/components/IncotermsInput";
import { CURRENCY_OPTIONS } from "@/lib/commerce";

interface SOItem {
  id: number;
  soId: number;
  yarnId: number;
  colorName: string;
  colorCode: string;
  yarnName: string;
  yarnCount: string;
  composition: string;
  factoryId: number;
  factoryName: string;
  quantity: string;
  unitPrice: number;
  currency: string;
  unit: string;
  weightBasis: string;
  incoterms: string;
  notes: string;
}

interface SalesOrder {
  id: number;
  soNo: string;
  customerId: number;
  contactId: number | null;
  shipToId: number | null;
  customerName: string;
  contactName: string | null;
  shipToName: string | null;
  customerPoNo: string;
  quoteNo: string;
  soDate: string;
  deliveryDate: string;
  status: string;
  notes: string;
  items: SOItem[];
}

interface Customer { id: number; name: string; officialName: string; }
interface Contact { id: number; customerId: number; contactName: string; position: string; email: string; }
interface ShipTo { id: number; name: string; officialName: string; category: string; contactCount: number; }
interface ShipToContact { id: number; shipToId: number; contactName: string; position: string; email: string; phone: string; }
interface Yarn { id: number; yarnName: string; factoryName: string; yarnCount: string; composition: string; }
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
interface QuoteItem {
  yarnId: number;
  yarnName: string;
  yarnCount: string;
  composition: string;
  quotedPrice: number;
  currency: string;
  unit: string;
  weightBasis: string;
  incoterms: string;
}
interface Company { id: number; name: string; isDefault: boolean; }
interface Props { permissions: Permissions; }

const STATUS_COLORS: Record<string, string> = {
  Confirmed: "bg-blue-100 text-blue-800",
  "In Production": "bg-amber-100 text-amber-800",
  Shipped: "bg-green-100 text-green-800",
  Delivered: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-red-100 text-red-800",
};

export default function SalesOrdersPage({ permissions }: Props) {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [contactList, setContactList] = useState<Contact[]>([]);
  const [shipToList, setShipToList] = useState<ShipTo[]>([]);
  const [yarnList, setYarnList] = useState<Yarn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<SalesOrder | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [fCustomer, setFCustomer] = useState(0);
  const [fContact, setFContact] = useState(0);
  const [fShipTo, setFShipTo] = useState(0);
  const [fShipToContact, setFShipToContact] = useState(0);
  const [shipToContactList, setShipToContactList] = useState<ShipToContact[]>([]);
  const [fOrderCategory, setFOrderCategory] = useState("Bulk");
  const [fQtyUnit, setFQtyUnit] = useState("KGS");
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [fCompanyId, setFCompanyId] = useState(0);
  const [fPaymentMethod, setFPaymentMethod] = useState("");
  const [fPaymentDays, setFPaymentDays] = useState("");
  const [fPaymentRef, setFPaymentRef] = useState("");
  const [fCustomerPoNo, setFCustomerPoNo] = useState("");
  const [fQuoteNo, setFQuoteNo] = useState("");
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [fSoDate, setFSoDate] = useState(new Date().toISOString().split("T")[0]);
  const [fDeliveryDate, setFDeliveryDate] = useState("");
  const [fStatus, setFStatus] = useState("Confirmed");
  const [fNotes, setFNotes] = useState("");
  const [fAutoCreatePO, setFAutoCreatePO] = useState(true);
  const [fItems, setFItems] = useState<FormItem[]>([
    { yarnId: 0, colorName: "", colorCode: "", quantity: "", unitPrice: "", currency: "USD", unit: "per KG", weightBasis: "condition", incoterms: "", notes: "" },
  ]);

  const { viewingYarn, setViewingYarn, openYarnDetail, allCerts } = useYarnDetail();

  const load = async () => {
    setLoading(true);
    const [o, c, cc, st, y, comps] = await Promise.all([
      fetch("/api/sales-orders").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/customer-contacts").then((r) => r.json()),
      fetch("/api/ship-to-addresses").then((r) => r.json()),
      fetch("/api/yarns").then((r) => r.json()),
      fetch("/api/companies").then((r) => r.json()),
    ]);
    setOrders(o);
    setCustomerList(c);
    setContactList(cc);
    setShipToList(st);
    setYarnList(y);
    setCompanyList(Array.isArray(comps) ? comps : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fContacts = useMemo(
    () => contactList.filter((c) => c.customerId === fCustomer),
    [contactList, fCustomer]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const s = search.toLowerCase();
    return orders.filter((o) =>
      o.soNo?.toLowerCase().includes(s) ||
      o.customerName?.toLowerCase().includes(s) ||
      o.customerPoNo?.toLowerCase().includes(s) ||
      o.items.some((i) =>
        i.yarnName?.toLowerCase().includes(s) ||
        (i.colorName || "").toLowerCase().includes(s) ||
        (i.colorCode || "").toLowerCase().includes(s)
      )
    );
  }, [orders, search]);

  const loadShipToContacts = async (shipToId: number) => {
    if (!shipToId) { setShipToContactList([]); return; }
    try {
      const data = await fetch(`/api/ship-to-contacts?shipToId=${shipToId}`).then((r) => r.json());
      setShipToContactList(data);
    } catch { setShipToContactList([]); }
  };

  const [editingSO, setEditingSO] = useState<SalesOrder | null>(null);

  const openForm = (so?: SalesOrder) => {
    if (so) {
      setEditingSO(so);
      setFCustomer(so.customerId);
      setFContact(so.contactId || 0);
      setFShipTo(so.shipToId || 0);
      setFShipToContact((so as SalesOrder & { shipToContactId?: number }).shipToContactId || 0);
      if (so.shipToId) loadShipToContacts(so.shipToId);
      setFOrderCategory((so as SalesOrder & { orderCategory?: string }).orderCategory || "Bulk");
      setFQtyUnit((so as SalesOrder & { quantityUnit?: string }).quantityUnit || "KGS");
      setFCompanyId((so as SalesOrder & { companyId?: number }).companyId || 0);
      const soAny = so as SalesOrder & { paymentMethod?: string; paymentDays?: number; paymentReference?: string };
      setFPaymentMethod(soAny.paymentMethod || "");
      setFPaymentDays(soAny.paymentDays ? String(soAny.paymentDays) : "");
      setFPaymentRef(soAny.paymentReference || "");
      setFCustomerPoNo(so.customerPoNo || "");
      setFQuoteNo(so.quoteNo || "");
      setQuoteItems([]);
      setFSoDate(so.soDate);
      setFDeliveryDate(so.deliveryDate || "");
      setFStatus(so.status || "Confirmed");
      setFNotes(so.notes || "");
      setFAutoCreatePO(false);
      setFItems(so.items.map((i) => ({
        yarnId: i.yarnId, colorName: i.colorName || "", colorCode: i.colorCode || "",
        quantity: i.quantity || "", unitPrice: String(i.unitPrice),
        currency: i.currency || "USD", unit: i.unit || "per KG",
        weightBasis: i.weightBasis || "condition", incoterms: i.incoterms || "", notes: i.notes || "",
      })));
      setShowForm(true);
      return;
    }
    setEditingSO(null);
    setFCustomer(0);
    setFContact(0);
    setFShipTo(0);
    setFShipToContact(0);
    setShipToContactList([]);
    setFOrderCategory("Bulk");
    setFQtyUnit("KGS");
    // Preselect the default letterhead company so the field is never blank.
    setFCompanyId(companyList.find((comp) => comp.isDefault)?.id || companyList[0]?.id || 0);
    setFPaymentMethod("");
    setFPaymentDays("");
    setFPaymentRef("");
    setFCustomerPoNo("");
    setFQuoteNo("");
    setQuoteItems([]);
    setFSoDate(new Date().toISOString().split("T")[0]);
    setFDeliveryDate("");
    setFStatus("Confirmed");
    setFNotes("");
    setFAutoCreatePO(true);
    setFItems([{ yarnId: 0, colorName: "", colorCode: "", quantity: "", unitPrice: "", currency: "USD", unit: "per KG", weightBasis: "condition", incoterms: "", notes: "" }]);
    setShowForm(true);
  };

  const loadQuoteItems = async (quoteNo: string) => {
    if (!quoteNo.trim()) {
      setQuoteItems([]);
      return;
    }
    try {
      const res = await fetch(`/api/quotations?quoteNo=${encodeURIComponent(quoteNo)}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const items: QuoteItem[] = data.map((r: any) => ({
          yarnId: r.yarnId,
          yarnName: r.yarnName || "",
          yarnCount: r.yarnCount || "",
          composition: r.composition || "",
          quotedPrice: r.quotedPrice,
          currency: r.currency || "USD",
          unit: r.unit || "per KG",
          weightBasis: r.weightBasis || "condition",
          incoterms: r.incoterms || "",
        }));
        setQuoteItems(items);
        if (!fCustomer && data[0].customerId) setFCustomer(data[0].customerId);
        if (!fContact && data[0].contactId) setFContact(data[0].contactId);
      } else {
        setQuoteItems([]);
      }
    } catch {
      setQuoteItems([]);
    }
  };

  const loadQuoteItemsToForm = () => {
    if (quoteItems.length === 0) return;
    const newItems: FormItem[] = quoteItems.map((q) => ({
      yarnId: q.yarnId,
      colorName: "",
      colorCode: "",
      quantity: "",
      unitPrice: String(q.quotedPrice),
      currency: q.currency,
      unit: q.unit,
      weightBasis: q.weightBasis,
      incoterms: q.incoterms,
      notes: "",
    }));
    setFItems(newItems);
    setToast({ type: "success", text: `Loaded ${newItems.length} item(s) from quotation` });
    setTimeout(() => setToast(null), 3000);
  };

  const copyItem = (idx: number) => {
    setFItems((prev) => {
      const item = prev[idx];
      const copy = { ...item, colorName: "", colorCode: "", notes: "" };
      const newItems = [...prev];
      newItems.splice(idx + 1, 0, copy);
      return newItems;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fCustomer) {
      setToast({ type: "error", text: "Select a customer" });
      return;
    }
    const validItems = fItems.filter((i) => i.yarnId && i.unitPrice);
    if (validItems.length === 0) {
      setToast({ type: "error", text: "Add at least one item" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSO?.id,
          companyId: fCompanyId || null,
          customerId: fCustomer,
          contactId: fContact || null,
          shipToId: fShipTo || null,
          shipToContactId: fShipToContact || null,
          orderCategory: fOrderCategory,
          quantityUnit: fQtyUnit,
          paymentMethod: fPaymentMethod || null,
          paymentDays: fPaymentDays ? parseInt(fPaymentDays) : null,
          paymentReference: fPaymentRef || null,
          customerPoNo: fCustomerPoNo,
          quoteNo: fQuoteNo,
          soDate: fSoDate,
          deliveryDate: fDeliveryDate,
          status: fStatus,
          notes: fNotes,
          items: validItems,
          autoCreatePO: fAutoCreatePO,
          userId: getUserId(),
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setToast({ type: "success", text: editingSO ? `Sales Order updated` : `Sales Order ${d.soNo} created${fAutoCreatePO ? " + PO(s) auto-created" : ""}` });
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
    if (!confirm("Delete this sales order?")) return;
    await fetch(`/api/sales-orders?id=${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Orders</h1>
          <p className="text-sm text-slate-500">{filtered.length} order(s)</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search..."
          />
          {permissions.canEdit && (
            <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              + New Sales Order
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3 font-medium">SO No.</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Client PO</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Ship-To</th>
              <th className="px-4 py-3 font-medium text-left">Items</th>
              <th className="px-4 py-3 font-medium">SO Date</th>
              <th className="px-4 py-3 font-medium">Delivery Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {(permissions.canEdit || permissions.canDelete) && <th className="px-4 py-3 font-medium w-24">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">No sales orders</td></tr>
            ) : filtered.map((o) => (
              <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3"><button onClick={() => setViewing(o)} className="font-medium text-blue-700 hover:underline">{o.soNo}</button></td>
                <td className="px-4 py-3">
                  {(o as SalesOrder & { orderCategory?: string }).orderCategory && (o as SalesOrder & { orderCategory?: string }).orderCategory !== "Bulk" ? (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${(o as SalesOrder & { orderCategory?: string }).orderCategory === "Sample" ? "bg-purple-100 text-purple-700" : (o as SalesOrder & { orderCategory?: string }).orderCategory === "Free of Charge" ? "bg-amber-100 text-amber-700" : "bg-cyan-100 text-cyan-700"}`}>{(o as SalesOrder & { orderCategory?: string }).orderCategory}</span>
                  ) : (
                    <span className="text-xs text-slate-400">Bulk</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{o.customerPoNo || "—"}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-xs">{o.customerName}</div>
                  {o.contactName && <div className="text-[10px] text-blue-600">Attn: {o.contactName}</div>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{o.shipToName || "—"}</td>
                <td className="px-4 py-3 text-center text-xs">{o.items.length}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{o.soDate}</td>
                <td className="px-4 py-3 text-xs">{(() => {
                  if (!o.deliveryDate) return <span className="text-slate-400">—</span>;
                  const today = new Date().toISOString().split("T")[0];
                  const late = o.deliveryDate < today && o.status !== "Delivered" && o.status !== "Cancelled";
                  if (!late) return <span className="text-slate-600">{o.deliveryDate}</span>;
                  const days = Math.round((new Date(today).getTime() - new Date(o.deliveryDate).getTime()) / 86400000);
                  return <span className="text-red-600 font-semibold">{o.deliveryDate} <span className="px-1 py-0.5 rounded bg-red-100 text-[10px]">{days}d late</span></span>;
                })()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[o.status] || "bg-slate-100 text-slate-700"}`}>
                    {o.status}
                  </span>
                </td>
                {(permissions.canEdit || permissions.canDelete) && (
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {permissions.canEdit && <button onClick={() => openForm(o)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>}
                    {permissions.canDelete && <button onClick={() => handleDelete(o.id)} className="text-red-500 hover:text-red-700 text-xs">Del</button>}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Sales Order Detail</h2>
                <p className="text-xs text-slate-500 mt-0.5">{viewing.soNo}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">Client</span>
                  <div className="font-medium">{viewing.customerName}</div>
                  {viewing.contactName && <div className="text-xs text-blue-600 mt-0.5">Attn: {viewing.contactName}</div>}
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Ship-To</span>
                  <div className="font-medium">{viewing.shipToName || "—"}</div>
                  {(viewing as SalesOrder & { shipToContactName?: string }).shipToContactName && <div className="text-xs text-blue-600 mt-0.5">Attn: {(viewing as SalesOrder & { shipToContactName?: string }).shipToContactName}</div>}
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">SO Date</span>
                  <div>{viewing.soDate}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Status</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[viewing.status] || ""}`}>
                    {viewing.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-6 text-xs text-slate-500 flex-wrap">
                <div>Category: <span className={`font-semibold ${{Sample:"text-purple-600","Free of Charge":"text-amber-600","Lab Dip":"text-cyan-600","Strike Off":"text-cyan-600"}[(viewing as SalesOrder & {orderCategory?:string}).orderCategory||""] || "text-slate-700"}`}>{(viewing as SalesOrder & {orderCategory?:string}).orderCategory || "Bulk"}</span></div>
                <div>Unit: <span className="font-semibold text-slate-700">{(viewing as SalesOrder & {quantityUnit?:string}).quantityUnit || "KGS"}</span></div>
                {(() => { const v = viewing as SalesOrder & {paymentMethod?:string;paymentDays?:number;paymentReference?:string}; return v.paymentMethod ? <div>Payment: <span className="font-semibold text-emerald-700">{v.paymentMethod}{v.paymentDays ? ` ${v.paymentDays} Days` : ""}{v.paymentReference ? ` from ${v.paymentReference}` : ""}</span></div> : null; })()}
                {viewing.customerPoNo && <div>Client PO: <span className="font-medium text-slate-700">{viewing.customerPoNo}</span></div>}
                {viewing.quoteNo && <div>Ref. Quotation: <span className="font-medium text-slate-700">{viewing.quoteNo}</span></div>}
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600">
                      <th className="px-4 py-3 font-medium">Yarn</th>
                      <th className="px-4 py-3 font-medium">Yarn Mill</th>
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
                            {item.yarnName}
                          </button>
                          <div className="text-xs text-slate-400">{item.yarnCount || ""} · {item.composition || ""}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{item.factoryName}</td>
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
                          {item.currency} {Number(item.unitPrice).toFixed(2)}
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
                <div className="text-sm text-slate-600">
                  <span className="text-xs text-slate-500 block mb-1">Notes</span>
                  {viewing.notes}
                </div>
              )}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <AuditInfo createdByName={(viewing as SalesOrder & { createdByName?: string }).createdByName} updatedByName={(viewing as SalesOrder & { updatedByName?: string }).updatedByName} />
                <div className="flex gap-2">
                  {permissions.canEdit && viewing.status === "Confirmed" && (
                    <button onClick={async () => {
                      const res = await fetch("/api/sales-orders", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: viewing.id, status: "In Production", customerId: viewing.customerId, soDate: viewing.soDate, contactId: viewing.contactId, shipToId: viewing.shipToId, shipToContactId: (viewing as SalesOrder & { shipToContactId?: number }).shipToContactId, items: viewing.items.map(i => ({ yarnId: i.yarnId, colorName: i.colorName, colorCode: i.colorCode, quantity: i.quantity, unitPrice: String(i.unitPrice), currency: i.currency, unit: i.unit, weightBasis: i.weightBasis, incoterms: i.incoterms, notes: i.notes })), userId: getUserId() }),
                      });
                      if (res.ok) { setToast({ type: "success", text: "Status changed to In Production (SO + PO synced)" }); setViewing(null); load(); }
                      else setToast({ type: "error", text: "Failed to update status" });
                      setTimeout(() => setToast(null), 3000);
                    }} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700">▶ Start Production</button>
                  )}
                  {permissions.canEdit && <button onClick={() => { setViewing(null); openForm(viewing); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Edit Order</button>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingSO ? `Edit Sales Order — ${editingSO.soNo}` : "New Sales Order"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                    <select value={fCompanyId} onChange={(e) => setFCompanyId(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                      <option value={0}>Select company...</option>
                      {companyList.map((comp) => <option key={comp.id} value={comp.id}>{comp.name}{comp.isDefault ? " (Default)" : ""}</option>)}
                    </select>
                    {companyList.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">No companies found — add one on the Companies page first.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Client *</label>
                    <select value={fCustomer} onChange={(e) => { setFCustomer(Number(e.target.value)); setFContact(0); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                      <option value={0}>Select...</option>
                      {customerList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.officialName ? ` — ${c.officialName}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                    <select value={fContact} onChange={(e) => setFContact(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" disabled={!fCustomer}>
                      <option value={0}>{fCustomer ? "— No specific contact —" : "Select client first"}</option>
                      {fContacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.contactName}{c.position ? ` · ${c.position}` : ""}
                        </option>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Term (Customer → Us)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select value={fPaymentMethod} onChange={(e) => setFPaymentMethod(e.target.value)} className="px-2 py-2 border border-slate-300 rounded-lg text-xs">
                        <option value="">— None —</option>
                        <option value="OA">OA (Open Account)</option>
                        <option value="TT">TT (Bank Transfer)</option>
                        <option value="LC">LC (Letter of Credit)</option>
                        <option value="DP">DP (Doc. against Payment)</option>
                        <option value="DA">DA (Doc. against Accept.)</option>
                        <option value="CAD">CAD (Cash against Doc.)</option>
                        <option value="Advance">Advance Payment</option>
                      </select>
                      <input type="number" value={fPaymentDays} onChange={(e) => setFPaymentDays(e.target.value)} className="px-2 py-2 border border-slate-300 rounded-lg text-xs" placeholder="Days" min="0" />
                      <select value={fPaymentRef} onChange={(e) => setFPaymentRef(e.target.value)} className="px-2 py-2 border border-slate-300 rounded-lg text-xs">
                        <option value="">From...</option>
                        <option value="Invoice Date">Invoice Date</option>
                        <option value="BL Date">BL Date</option>
                        <option value="Shipment Date">Shipment Date</option>
                        <option value="Delivery Date">Delivery Date</option>
                        <option value="Before Shipment">Before Shipment</option>
                        <option value="At Sight">At Sight</option>
                      </select>
                    </div>
                    {fPaymentMethod && <div className="mt-1 text-[10px] text-slate-400">e.g. {fPaymentMethod}{fPaymentDays ? ` ${fPaymentDays} Days` : ""}{fPaymentRef ? ` from ${fPaymentRef}` : ""}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                      <option>Confirmed</option>
                      <option>In Production</option>
                      <option>Shipped</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ship-To Destination</label>
                    <select value={fShipTo} onChange={(e) => { const v = Number(e.target.value); setFShipTo(v); setFShipToContact(0); loadShipToContacts(v); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                      <option value={0}>— None —</option>
                      {shipToList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}{s.category ? ` (${s.category})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ship-To Contact Person</label>
                    <select value={fShipToContact} onChange={(e) => setFShipToContact(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" disabled={!fShipTo}>
                      <option value={0}>{fShipTo ? (shipToContactList.length > 0 ? "— No specific contact —" : "— No contacts —") : "Select ship-to first"}</option>
                      {shipToContactList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.contactName}{c.position ? ` · ${c.position}` : ""}{c.email ? ` · ${c.email}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">SO Date *</label>
                      <input type="date" value={fSoDate} onChange={(e) => setFSoDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Date</label>
                      <input type="date" value={fDeliveryDate} onChange={(e) => setFDeliveryDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Client PO No.</label>
                    <input type="text" value={fCustomerPoNo} onChange={(e) => setFCustomerPoNo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Client's purchase order number" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ref. Quotation No.</label>
                    <div className="flex gap-2">
                      <input type="text" value={fQuoteNo} onChange={(e) => setFQuoteNo(e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. FOGQ-20260810-XXXX" />
                      <button type="button" onClick={() => loadQuoteItems(fQuoteNo)} disabled={!fQuoteNo.trim()} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 disabled:opacity-50 shrink-0">Load</button>
                    </div>
                    {quoteItems.length > 0 && (
                      <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <span className="text-xs text-green-700">{quoteItems.length} item(s) found in quotation</span>
                        <button type="button" onClick={loadQuoteItemsToForm} className="text-xs font-medium text-green-700 hover:text-green-900 underline">
                          Load items into order →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Order Items ({fItems.length})</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setFItems((p) => [
                        ...p,
                        { yarnId: 0, colorName: "", colorCode: "", quantity: "", unitPrice: "", currency: "USD", unit: "per KG", weightBasis: "condition", incoterms: "", notes: "" },
                      ])
                    }
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300"
                  >
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
                            <button
                              type="button"
                              onClick={() => setFItems((p) => p.filter((_, i) => i !== idx))}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-2">
                          <select
                            value={item.yarnId}
                            onChange={(e) => setFItems((p) => p.map((l, i) => i === idx ? { ...l, yarnId: Number(e.target.value) } : l))}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                          >
                            <option value={0}>Select yarn...</option>
                            {yarnList.map((y) => (
                              <option key={y.id} value={y.id}>
                                {y.yarnName} · {y.yarnCount || "—"} · {y.factoryName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={item.colorName}
                            onChange={(e) => setFItems((p) => p.map((l, i) => i === idx ? { ...l, colorName: e.target.value } : l))}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                            placeholder="Color Name"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={item.colorCode}
                            onChange={(e) => setFItems((p) => p.map((l, i) => i === idx ? { ...l, colorCode: e.target.value } : l))}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                            placeholder="Color Code"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-6 gap-2 mt-2">
                        <div>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => setFItems((p) => p.map((l, i) => i === idx ? { ...l, quantity: e.target.value } : l))}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                            placeholder="Qty"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => setFItems((p) => p.map((l, i) => i === idx ? { ...l, unitPrice: e.target.value } : l))}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                            placeholder="Price"
                          />
                        </div>
                        <div>
                          <select
                            value={item.currency}
                            onChange={(e) => setFItems((p) => p.map((l, i) => i === idx ? { ...l, currency: e.target.value } : l))}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          >
                            {CURRENCY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <select
                            value={item.unit}
                            onChange={(e) => setFItems((p) => p.map((l, i) => i === idx ? { ...l, unit: e.target.value } : l))}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          >
                            <option>per KG</option>
                            <option>per LB</option>
                            <option>per Cone</option>
                          </select>
                        </div>
                        <div>
                          <select
                            value={item.weightBasis}
                            onChange={(e) => setFItems((p) => p.map((l, i) => i === idx ? { ...l, weightBasis: e.target.value } : l))}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          >
                            <option value="condition">Cond.</option>
                            <option value="net">Net</option>
                          </select>
                        </div>
                        <div className="col-span-full">
                          <IncotermsInput compact value={item.incoterms} onChange={(v) => setFItems((p) => p.map((l, i) => i === idx ? { ...l, incoterms: v } : l))} />
                        </div>
                      </div>

                      <div className="mt-2">
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => setFItems((p) => p.map((l, i) => i === idx ? { ...l, notes: e.target.value } : l))}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                          placeholder="Item remarks (optional)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} />
              </div>

              <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fAutoCreatePO}
                    onChange={(e) => setFAutoCreatePO(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Auto-create Purchase Order(s) to yarn mill(s)</span>
                </label>
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "Saving..." : editingSO ? "Update Sales Order" : "Create Sales Order"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingYarn && <YarnDetailModal yarn={viewingYarn} certs={allCerts} onClose={() => setViewingYarn(null)} />}
    </div>
  );
}
