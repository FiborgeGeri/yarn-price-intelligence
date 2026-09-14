import { NextResponse } from "next/server";
import { db } from "@/db";
import { bankAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserMap } from "@/lib/auditHelpers";

const VALID_ENTITY_TYPES = ["customer", "factory", "company"];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (entityType && !VALID_ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });
    }

    const conditions = [];
    if (entityType) conditions.push(eq(bankAccounts.entityType, entityType));
    if (entityId) conditions.push(eq(bankAccounts.entityId, Number(entityId)));

    const rows = await db
      .select()
      .from(bankAccounts)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const userMap = await getUserMap();

    const enriched = rows.map((row: any) => ({
      ...row,
      createdByName: row.createdBy ? userMap[row.createdBy] || null : null,
      updatedByName: row.updatedBy ? userMap[row.updatedBy] || null : null,
    }));

    enriched.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return (a.bankName || "").localeCompare(b.bankName || "");
    });

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("GET /api/bank-accounts error:", err);
    return NextResponse.json({ error: "Failed to load bank accounts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id, entityType, entityId, bankName, bankCode, branch,
      accountName, accountNumber, currency, swiftCode, iban,
      bankAddress, isDefault, notes, userId,
    } = body;

    if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });
    }
    if (!entityId) {
      return NextResponse.json({ error: "Missing entityId" }, { status: 400 });
    }
    if (!bankName || !bankName.trim()) {
      return NextResponse.json({ error: "Bank name is required" }, { status: 400 });
    }

    if (isDefault) {
      await db.update(bankAccounts).set({ isDefault: false }).where(
        and(eq(bankAccounts.entityType, entityType), eq(bankAccounts.entityId, Number(entityId)))
      );
    }

    const dataToSave = {
      entityType,
      entityId: Number(entityId),
      bankName: bankName.trim(),
      bankCode: bankCode || null,
      branch: branch || null,
      accountName: accountName || null,
      accountNumber: accountNumber || null,
      currency: currency || null,
      swiftCode: swiftCode || null,
      iban: iban || null,
      bankAddress: bankAddress || null,
      isDefault: !!isDefault,
      notes: notes || null,
      updatedAt: new Date(),
      updatedBy: userId || null,
    };

    if (id) {
      await db.update(bankAccounts).set(dataToSave).where(eq(bankAccounts.id, Number(id)));
      return NextResponse.json({ ok: true, id });
    } else {
      const [inserted] = await db.insert(bankAccounts).values({
        ...dataToSave,
        createdAt: new Date(),
        createdBy: userId || null,
      }).returning();
      return NextResponse.json({ ok: true, id: inserted.id });
    }
  } catch (err: any) {
    console.error("POST /api/bank-accounts error:", err);
    return NextResponse.json({ error: err?.message || "Failed to save bank account" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(bankAccounts).where(eq(bankAccounts.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/bank-accounts error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
