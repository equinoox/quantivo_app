import { asc, eq, isNull } from "drizzle-orm";

import { CreateFinancialItemInput, FinancialItem } from "@/features/revenues-expenses/types/financial-item.types";
import { db } from "@/shared/lib/db/client";
import { financialItems } from "@/shared/lib/db/schema";

function createFinancialItemId(): string {
  return `fin_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function listFinancialItems(): Promise<FinancialItem[]> {
  return db.select().from(financialItems).where(isNull(financialItems.deletedAt)).orderBy(asc(financialItems.type), asc(financialItems.name));
}

export async function createFinancialItem(input: CreateFinancialItemInput): Promise<FinancialItem> {
  // TODO: Add amount/value input later.
  // TODO: Connect expenses and revenues with dashboard calculations later.
  const now = new Date().toISOString();
  const id = createFinancialItemId();
  await db.insert(financialItems).values({
    behavior: input.behavior,
    createdAt: now,
    deletedAt: null,
    id,
    name: input.name.trim().replace(/\s+/g, " "),
    requiresExplanation: input.requiresExplanation,
    type: input.type,
    updatedAt: now,
  });

  const [createdItem] = await db.select().from(financialItems).where(eq(financialItems.id, id)).limit(1);
  return createdItem;
}

export async function deleteFinancialItem(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.update(financialItems).set({ deletedAt: now, updatedAt: now }).where(eq(financialItems.id, id));
}
