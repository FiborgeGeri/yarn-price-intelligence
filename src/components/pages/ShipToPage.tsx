"use client";
import { useState, useEffect, useMemo } from "react";
import { Permissions } from "@/lib/permissions";

interface Address { id: number; customerId: number; customerName: string; addressName: string; addressLine1: string; addressLine2: string; city: string; state: string; postalCode: string; country: string; contactName: string; contactPhone: string; notes: string; }
interface Customer { id: number; name: string; company: string; }
interface Props { permissions: Permissions; }

export default function ShipToPage({ permissions }: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const [fCustomer, setFCustomer] = useState(0);
  const [fName, setFName] = useState("");
  const [fLine1, setFLine1] = useState(""); const [fLine2, setFLine2] = useState("");
  const [fCity, setFCity] = useState(""); const [fState, setFState] = useState("");
  const [fPostal, setFPostal] = useState(""); const [fCountry, setFCountry] = useState("");
  const [fContact, setFContact] = useState(""); const [fPhone, setFPhone] = useState("");
  const [fNotes, setFNotes] = useState("");

  const load = async () => { setLoading(true); const [a, c] = await Promise.all([fetch("/api/ship-to-addresses").then((r) => r.json()), fetch("/api/customers").then((r) => r.json())]); setAddresses(a); setCustomerList(c); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let r = addresses;
    if (customerFilter) r = r.filter((a) => String(a.customerId) === customerFilter);
    if (search.trim()) { const s = search.toLowerCase(); r = r.filter((a) => a.addressName?.toLowerCase().includes(s) || a.customerName?.toLowerCase().includes(s) || a.city?.toLowerCase().includes(s) || a.country?.toLowerCase().includes(s) || a.contactName?.toLowerCase().includes(s)); }
    return r;
  }, [addresses, customerFilter, search]);

  const openForm = (a?: Address) => {
    if (a) { setEditing(a); setFCustomer(a.customerId); setFName(a.addressName); setFLine1(a.addressLine1 || ""); setFLine2(a.addressLine2 || ""); setFCity(a.city || ""); setFState(a.state || ""); setFPostal(a.postalCode || ""); setFCountry(a.country || ""); setFContact(a.contactName || ""); setFPhone(a.contactPhone || ""); setFNotes(a.notes || ""); }
    else { setEditing(null); setFCustomer(0); setFName(""); setFLine1(""); setFLine2(""); setFCity(""); setFState(""); setFPostal(""); setFCountry(""); setFContact(""); setFPhone(""); setFNotes(""); }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!fCustomer || !fName) return; setSaving(true);
    const res = await fetch("/api/ship-to-addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing?.id, customerId: fCustomer, addressName: fName, addressLine1: fLine1, addressLine2: fLine2, city: fCity, state: fState, postalCode: fPostal, country: fCountry, contactName: fContact, contactPhone: fPhone, notes: fNotes }) });
    if (res.ok) { setToast({ type: "success", text: editing ? "Updated" : "Created" }); setShowForm(false); load(); } else setToast({ type: "error", text: "Failed" });
    setSaving(false); setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => { if (!confirm("Delete this address?")) return; await fetch(`/api/ship-to-addresses?id=${id}`, { method: "DELETE" }); load(); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Ship-To Addresses</h1><p className="text-sm text-slate-500">{filtered.length} address(es)</p></div>
        {permissions.canEdit && <button onClick={() => openForm()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Address</button>}
      </div>
      {toast && <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{toast.text}</div>}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search address, customer, city, country, contact..." />
        <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"><option value="">All Customers</option>{customerList.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}</select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-left text-slate-600"><th className="px-4 py-3 font-medium">Address Name</th><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">City</th><th className="px-4 py-3 font-medium">Country</th><th className="px-4 py-3 font-medium">Contact</th><th className="px-4 py-3 font-medium">Phone</th>{(permissions.canEdit || permissions.canDelete) && <th className="px-4 py-3 font-medium w-20">Actions</th>}</tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No addresses</td></tr> :
              filtered.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3"><div className="font-medium">{a.addressName}</div><div className="text-xs text-slate-500">{[a.addressLine1, a.addressLine2].filter(Boolean).join(", ") || "—"}</div></td>
                  <td className="px-4 py-3 text-slate-600">{a.customerName || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{a.city || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{a.country || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{a.contactName || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{a.contactPhone || "—"}</td>
                  {(permissions.canEdit || permissions.canDelete) && <td className="px-4 py-3"><div className="flex gap-2">{permissions.canEdit && <button onClick={() => openForm(a)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>}{permissions.canDelete && <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 text-xs">Del</button>}</div></td>}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && permissions.canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? "Edit Address" : "Add Ship-To Address"}</h2><button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button></div>
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label><select value={fCustomer} onChange={(e) => setFCustomer(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required><option value={0}>Select...</option>{customerList.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Address Name *</label><input type="text" value={fName} onChange={(e) => setFName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Head Office, Warehouse HK" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1</label><input type="text" value={fLine1} onChange={(e) => setFLine1(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label><input type="text" value={fLine2} onChange={(e) => setFLine2(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">City</label><input type="text" value={fCity} onChange={(e) => setFCity(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">State / Province</label><input type="text" value={fState} onChange={(e) => setFState(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label><input type="text" value={fPostal} onChange={(e) => setFPostal(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Country</label><input type="text" value={fCountry} onChange={(e) => setFCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label><input type="text" value={fContact} onChange={(e) => setFContact(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label><input type="text" value={fPhone} onChange={(e) => setFPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} /></div>
            <div className="flex gap-3 pt-2"><button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button></div>
          </form>
        </div></div>
      )}
    </div>
  );
}
