import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceItems, payments, customers, customerContacts, companies, yarns, factories, treatments } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

const INVOICE_TYPES = [
  "Proforma Invoice",
  "Deposit Invoice",
  "Commercial Invoice",
  "Balance Invoice",
  "Debit Note",
  "Credit Note",
] as const;

const TYPE_PREFIX: Record<string, string> = {
  "Proforma Invoice": "PI",
  "Deposit Invoice": "DEP",
  "Commercial Invoice": "INV",
  "Balance Invoice": "BAL",
  "Debit Note": "DN",
  "Credit Note": "CN",
};

function createInvoiceNo(type?: string) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const prefix = TYPE_PREFIX[type || "Commercial Invoice"] || "INV";
  return `${prefix}-${y}${m}${day}-${rand}`;
}

export async function GET(req: NextRequest) {
  try {
    const idParam = req.nextUrl.searchParams.get("id");
    const paidSq = sql<number>`coalesce((select sum(p.amount) from payments p where p.invoice_id = ${invoices.id}), 0)`;

    const rows = await db
      .select({
        id: invoices.id,
        invoiceNo: invoices.invoiceNo,
        invoiceType: invoices.invoiceType,
        companyId: invoices.companyId,
        companyName: companies.name,
        customerId: invoices.customerId,
        customerName: customers.name,
        customerCompany: customers.officialName,
        contactId: invoices.contactId,
        contactName: customerContacts.contactName,
        soId: invoices.soId,
        soNo: invoices.soNo,
        customerPoNo: invoices.customerPoNo,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        currency: invoices.currency,
        vatRate: invoices.vatRate,
        subtotal: invoices.subtotal,
        vatAmount: invoices.vatAmount,
        total: invoices.total,
        status: invoices.status,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
        createdBy: invoices.createdBy,
        updatedBy: invoices.updatedBy,
        paid: paidSq,
      })
      .from(invoices)
      .leftJoin(companies, eq(invoices.companyId, companies.id))
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(customerContacts, eq(invoices.contactId, customerContacts.id))
      .orderBy(desc(invoices.invoiceDate), desc(invoices.createdAt));

    const userMap = await getUserMap();
    const withMeta = rows.map((r) => ({
      ...r,
      outstanding: Math.max(0, (r.total || 0) - (r.paid || 0)),
      createdByName: r.createdBy ? userMap[r.createdBy] || null : null,
      updatedByName: r.updatedBy ? userMap[r.updatedBy] || null : null,
    }));

    if (idParam) {
      const id = Number(idParam);
      const head = withMeta.find((r) => r.id === id);
      if (!head) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const items = await db
        .select({
          id: invoiceItems.id,
          yarnId: invoiceItems.yarnId,
          description: invoiceItems.description,
          colorName: invoiceItems.colorName,
          colorCode: invoiceItems.colorCode,
          quantity: invoiceItems.quantity,
          unitPrice: invoiceItems.unitPrice,
          unit: invoiceItems.unit,
          weightBasis: invoiceItems.weightBasis,
          incoterms: invoiceItems.incoterms,
          amount: invoiceItems.amount,
          notes: invoiceItems.notes,
          yarnName: yarns.yarnName,
          yarnCount: yarns.yarnCount,
          factoryName: factories.factoryName,
          treatmentName: treatments.name,
        })
        .from(invoiceItems)
        .leftJoin(yarns, eq(invoiceItems.yarnId, yarns.id))
        .leftJoin(factories, eq(yarns.factoryId, factories.id))
        .leftJoin(treatments, eq(yarns.treatmentId, treatments.id))
        .where(eq(invoiceItems.invoiceId, id));
      const payRows = await db.select().from(payments).where(eq(payments.invoiceId, id)).orderBy(desc(payments.paymentDate));
      return NextResponse.json({ ...head, items, payments: payRows });
    }

    return NextResponse.json(withMeta);
  } catch (err) {
    console.error("Invoices GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

interface ItemInput {
  id?: number;
  yarnId?: number | null;
  description?: string;
  colorName?: string;
  colorCode?: string;
  quantity?: string;
  unitPrice: number | string;
  unit?: string;
  weightBasis?: string;
  incoterms?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id, invoiceType, companyId, customerId, contactId, soId, soNo, customerPoNo,
      invoiceDate, dueDate, currency, vatRate, status, notes, userId,
      items = [],
    } = body as {
      id?: number; invoiceType?: string;
      companyId?: number | null; customerId?: number | null; contactId?: number | null;
      soId?: number | null; soNo?: string | null; customerPoNo?: string | null;
      invoiceDate: string; dueDate?: string | null; currency?: string; vatRate?: number | string;
      status?: string; notes?: string | null; userId?: number | null; items?: ItemInput[];
    };

    if (!customerId || !invoiceDate) {
      return NextResponse.json({ error: "Client and invoice date are required" }, { status: 400 });
    }

    const finalType = invoiceType || "Commercial Invoice";
    const cleanItems = (items as ItemInput[]).filter((it) => Number(it.unitPrice) > 0);
    const subtotal = cleanItems.reduce((s, it) => s + (parseQty(String(it.quantity || "")) * Number(it.unitPrice) || 0), 0);
    const rate = Number(vatRate) || 0;
    const vatAmount = Math.round(subtotal * (rate / 100) * 100) / 100;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;

    if (id) {
      await db.update(invoices).set({
        invoiceType: finalType,
        companyId: companyId || null,
        customerId,
        contactId: contactId || null,
        soId: soId || null,
        soNo: soNo || null,
        customerPoNo: customerPoNo || null,
        invoiceDate,
        dueDate: dueDate || null,
        currency: currency || "USD",
        vatRate: rate,
        subtotal, vatAmount, total,
        status: status || "Draft",
        notes: notes || null,
        updatedAt: new Date(),
        updatedBy: userId || null,
      }).where(eq(invoices.id, id));
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
      if (cleanItems.length > 0) {
        await db.insert(invoiceItems).values(cleanItems.map((it) => itemRow(id, it)));
      }
      return NextResponse.json({ id, updated: true });
    }

    const [created] = await db.insert(invoices).values({
      invoiceNo: createInvoiceNo(finalType),
      invoiceType: finalType,
      companyId: companyId || null,
      customerId,
      contactId: contactId || null,
      soId: soId || null,
      soNo: soNo || null,
      customerPoNo: customerPoNo || null,
      invoiceDate,
      dueDate: dueDate || null,
      currency: currency || "USD",
      vatRate: rate,
      subtotal, vatAmount, total,
      status: status || "Draft",
      notes: notes || null,
      createdBy: userId || null,
      updatedBy: userId || null,
    }).returning({ id: invoices.id, invoiceNo: invoices.invoiceNo });

    if (cleanItems.length > 0) {
      await db.insert(invoiceItems).values(cleanItems.map((it) => itemRow(created.id, it)));
    }
    return NextResponse.json(created);
  } catch (err) {
    console.error("Invoices POST error:", err);
    return NextResponse.json({ error: "Failed to save invoice" }, { status: 500 });
  }
}

function parseQty(q: string): number {
  const n = parseFloat(q.replace(/[, ]/g, ""));
  return isNaN(n) ? 0 : n;
}

function itemRow(invoiceId: number, it: ItemInput) {
  const qty = parseQty(String(it.quantity || ""));
  const amount = Math.round(qty * Number(it.unitPrice) * 100) / 100;
  return {
    invoiceId,
    yarnId: it.yarnId || null,
    description: it.description || null,
    colorName: it.colorName || null,
    colorCode: it.colorCode || null,
    quantity: it.quantity || null,
    unitPrice: Number(it.unitPrice),
    unit: it.unit || "per KG",
    weightBasis: it.weightBasis || "condition",
    incoterms: it.incoterms || null,
    amount,
    notes: it.notes || null,
  };
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(invoices).where(eq(invoices.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Invoices DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
