import { desc, eq, isNull } from "drizzle-orm";

import { CreateCustomFinancialEntryInput, CustomFinancialEntry, InventoryFinanceResult } from "@/features/finances/types/finance.types";
import { db } from "@/shared/lib/db/client";
import { customFinancialEntries, inventoryLists } from "@/shared/lib/db/schema";
import { createLocalId } from "@/shared/lib/id/createLocalId";

export async function createCustomFinancialEntry(input: CreateCustomFinancialEntryInput): Promise<CustomFinancialEntry> {
  const now = new Date().toISOString();
  const id = createLocalId("cfin");

  await db.insert(customFinancialEntries).values({
    amount: input.amount,
    behavior: input.behavior,
    createdAt: now,
    createdByUserId: input.createdByUserId,
    date: input.date,
    dateKey: input.dateKey,
    deletedAt: null,
    explanation: input.explanation.trim(),
    id,
    name: input.name.trim().replace(/\s+/g, " "),
    type: input.type,
    updatedAt: now,
  });

  const [entry] = await db.select().from(customFinancialEntries).where(eq(customFinancialEntries.id, id)).limit(1);
  return entry;
}

export async function listCustomFinancialEntries(): Promise<CustomFinancialEntry[]> {
  return db.select().from(customFinancialEntries).where(isNull(customFinancialEntries.deletedAt)).orderBy(desc(customFinancialEntries.dateKey), desc(customFinancialEntries.createdAt));
}

export async function listInventoryFinanceResults(): Promise<InventoryFinanceResult[]> {
  return db
    .select({
      createdAt: inventoryLists.createdAt,
      date: inventoryLists.date,
      id: inventoryLists.id,
      shift: inventoryLists.shift,
      totalEarn: inventoryLists.totalEarn,
    })
    .from(inventoryLists)
    .orderBy(desc(inventoryLists.createdAt));
}
