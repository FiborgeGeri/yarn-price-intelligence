import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supplierInvoices, supplierInvoiceItems, supplierPayments, factories, companies, yarns, treatments, bankAccounts } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

const TYPE_PREFIX: Record<string, string> = {
  "Proforma Invoice": "SPI",
  "Deposit Invoice": "SDEP",
  "Commercial Invoice": "SINV",
  "Balance Invoice": "SBAL",
  "Debit Note": "SDN",
  "Credit Note": "SCN",
};

function createInternalNo(type?: string) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const prefix = TYPE_PREFIX[type || "Commercial Invoice"] || "SINV";
  return `${prefix}-${y}${m}${day}-${rand}`;
}

export async function GET(req: NextRequest) {
  try {
    const idParam = req.nextUrl.searchParams.get("id");
    const paidSq = sql<number>`coalesce((select sum(p.amount) from supplier_payments p where p.supplier_invoice_id = ${supplierInvoices.id}), 0)`;

    const rows = await db
      .select({
        id: supplierInvoices.id,
        supplierInvoiceNo: supplierInvoices.supplierInvoiceNo,
        internalNo: supplierInvoices.internalNo,
        invoiceType: supplierInvoices.invoiceType,
        depositPercentage: supplierInvoices.depositPercentage,
        bankAccountId: supplierInvoices.bankAccountId,
        companyId: supplierInvoices.companyId,
        companyName: companies.name,
        factoryId: supplierInvoices.factoryId,
        factoryName: factories.factoryName,
        poId: supplierInvoices.poId,
        poNo: supplierInvoices.poNo,
        invoiceDate: supplierInvoices.invoiceDate,
        dueDate: supplierInvoices.dueDate,
        currency: supplierInvoices.currency,
        vatRate: supplierInvoices.vatRate,
        subtotal: supplierInvoices.subtotal,
        vatAmount: supplierInvoices.vatAmount,
        total: supplierInvoices.total,
        status: supplierInvoices.status,
        notes: supplierInvoices.notes,
        createdAt: supplierInvoices.createdAt,
        createdBy: supplierInvoices.createdBy,
        updatedBy: supplierInvoices.updatedBy,
        paid: paidSq,
      })
      .from(supplierInvoices)
      .leftJoin(companies, eq(supplierInvoices.companyId, companies.id))
      .leftJoin(factories, eq(supplierInvoices.factoryId, factories.id))
      .orderBy(desc(supplierInvoices.invoiceDate), desc(supplierInvoices.createdAt));

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
          id: supplierInvoiceItems.id,
          yarnId: supplierInvoiceItems.yarnId,
          description: supplierInvoiceItems.description,
          colorName: supplierInvoiceItems.colorName,
          colorCode: supplierInvoiceItems.colorCode,
          quantity: supplierInvoiceItems.quantity,
          unitPrice: supplierInvoiceItems.unitPrice,
          unit: supplierInvoiceItems.unit,
          weightBasis: supplierInvoiceItems.weightBasis,
          incoterms: supplierInvoiceItems.incoterms,
          amount: supplierInvoiceItems.amount,
          notes: supplierInvoiceItems.notes,
          yarnName: yarns.yarnName,
          yarnCount: yarns.yarnCount,
          treatmentName: treatments.name,
        })
        .from(supplierInvoiceItems)
        .leftJoin(yarns, eq(supplierInvoiceItems.yarnId, yarns.id))
        .leftJoin(treatments, eq(yarns.treatmentId, treatments.id))
        .where(eq(supplierInvoiceItems.supplierInvoiceId, id));

      const payRows = await db.select().from(supplierPayments).where(eq(supplierPayments.supplierInvoiceId, id)).orderBy(desc(supplierPayments.paymentDate));
      
      // 智能撈取綁定的工廠/紗廠銀行帳戶詳細資料
      let bankInfo = null;
      if (head.bankAccountId) {
        const [bank] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, head.bankAccountId));
        if (bank) bankInfo = bank;
      }

      return NextResponse.json({ ...head, items, payments: payRows, bankInfo });
    }

    return NextResponse.json(withMeta);
  } catch (err) {
    console.error("Supplier invoices GET error:", err);
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

function parseQty(q: string): number {
  const n = parseFloat(q.replace(/[, ]/g, ""));
  return isNaN(n) ? 0 : n;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id, invoiceType, depositPercentage, bankAccountId, supplierInvoiceNo, companyId, factoryId, poId, poNo,
      invoiceDate, dueDate, currency, vatRate, status, notes, userId,
      items = [],
    } = body as {
      id?: number; invoiceType?: string; depositPercentage?: number | string | null; bankAccountId?: number | null;
      supplierInvoiceNo?: string | null; companyId?: number | null; factoryId?: number | null;
      poId?: number | null; poNo?: string | null;
      invoiceDate?: string; dueDate?: string | null; currency?: string; vatRate?: number | string;
      status?: string; notes?: string | null; userId?: number | null; items?: ItemInput[];
    };

    if (!factoryId || !invoiceDate) {
      return NextResponse.json({ error: "Yarn mill and invoice date are required" }, { status: 400 });
    }

    const finalType = invoiceType || "Commercial Invoice";
    const depositPct = depositPercentage !== null && depositPercentage !== undefined && depositPercentage !== ""
      ? Number(depositPercentage)
      : null;

    const cleanItems = (items as ItemInput[]).filter((it) => Number(it.unitPrice) > 0);
    const subtotal = cleanItems.reduce((s, it) => s + (parseQty(String(it.quantity || "0")) * Number(it.unitPrice) || 0), 0);
    const rate = Number(vatRate) || 0;
    const vatAmount = Math.round(subtotal * (rate / 100) * 100) / 100;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;

    const dataToSave = {
      invoiceType: finalType,
      depositPercentage: depositPct,
      bankAccountId: bankAccountId || null,
      supplierInvoiceNo: supplierInvoiceNo || null,
      companyId: companyId || null,
      factoryId,
      poId: poId || null,
      poNo: poNo || null,
      invoiceDate,
      dueDate: dueDate || null,
      currency: currency || "USD",
      vatRate: rate,
      subtotal, vatAmount, total,
      status: status || "Received",
      notes: notes || null,
      updatedAt: new Date(),
      updatedBy: userId || null,
    };

    if (id) {
      await db.update(supplierInvoices).set(dataToSave).where(eq(supplierInvoices.id, id));
      await db.delete(supplierInvoiceItems).where(eq(supplierInvoiceItems.supplierInvoiceId, id));
      if (cleanItems.length > 0) {
        await db.insert(supplierInvoiceItems).values(cleanItems.map((it) => itemRow(id, it)));
      }
      return NextResponse.json({ id, updated: true });
    }

    const [created] = await db.insert(supplierInvoices).values({
      internalNo: createInternalNo(finalType),
      ...dataToSave,
      createdAt: new Date(),
      createdBy: userId || null,
    }).returning({ id: supplierInvoices.id, internalNo: supplierInvoices.internalNo });

    if (cleanItems.length > 0) {
      await db.insert(supplierInvoiceItems).values(cleanItems.map((it) => itemRow(created.id, it)));
    }
    return NextResponse.json(created);
  } catch (err) {
    console.error("Supplier invoices POST error:", err);
    return NextResponse.json({ error: "Failed to save supplier invoice" }, { status: 500 });
  }
}

function itemRow(supplierInvoiceId: number, it: ItemInput) {
  const qty = parseQty(String(it.quantity || ""));
  const amount = Math.round(qty * Number(it.unitPrice) * 100) / 100;
  return {
    supplierInvoiceId,
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
    await db.delete(supplierInvoices).where(eq(supplierInvoices.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Supplier invoices DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
