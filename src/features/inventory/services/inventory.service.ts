import { and, desc, eq, ne } from "drizzle-orm";

import { FinishedInventoryList, FinishInventoryListInput, InventoryListDetail, InventoryListFinancialEntryDetail, InventoryListProductDetail, InventoryListSummary, UpdateInventoryListInput } from "@/features/inventory/types/inventory.types";
import { db } from "@/shared/lib/db/client";
import { categories, inventoryItems, inventoryListFinancialEntries, inventoryListItems, inventoryLists, inventoryNotifications, products as productTable, units, users } from "@/shared/lib/db/schema";
import { createLocalId } from "@/shared/lib/id/createLocalId";

export const INVENTORY_LIST_DUPLICATE_ERROR = "INVENTORY_LIST_DUPLICATE";

function getStoredExpression(expression: string, value: number): string {
  return expression.trim() || value.toString();
}

async function inventoryListExists(dateKey: string, shift: FinishInventoryListInput["shift"]): Promise<boolean> {
  const [existingList] = await db.select({ id: inventoryLists.id }).from(inventoryLists).where(and(eq(inventoryLists.dateKey, dateKey), eq(inventoryLists.shift, shift))).limit(1);
  return Boolean(existingList);
}

async function inventoryListExistsForOtherList(id: string, dateKey: string, shift: FinishInventoryListInput["shift"]): Promise<boolean> {
  const [existingList] = await db.select({ id: inventoryLists.id }).from(inventoryLists).where(and(eq(inventoryLists.dateKey, dateKey), eq(inventoryLists.shift, shift))).limit(1);
  return Boolean(existingList && existingList.id !== id);
}

async function isLatestInventoryList(id: string): Promise<boolean> {
  const [latestList] = await db.select({ id: inventoryLists.id }).from(inventoryLists).orderBy(desc(inventoryLists.createdAt)).limit(1);
  return latestList?.id === id;
}

export async function finishInventoryList(input: FinishInventoryListInput): Promise<FinishedInventoryList> {
  if (await inventoryListExists(input.dateKey, input.shift)) {
    throw new Error(INVENTORY_LIST_DUPLICATE_ERROR);
  }

  const now = new Date().toISOString();
  const inventoryListId = createLocalId("invl");

  try {
    await db.transaction(async (tx) => {
      await tx.insert(inventoryLists).values({
        bilans: input.bilans,
        createdAt: now,
        createdByUserId: input.createdByUserId,
        date: input.date,
        dateKey: input.dateKey,
        id: inventoryListId,
        shift: input.shift,
        totalEarn: input.totalEarn,
        totalExpenses: input.totalExpenses,
        totalProductEarnings: input.totalProductEarnings,
        totalRevenues: input.totalRevenues,
        updatedAt: now,
      });

      if (input.products.length > 0) {
        await tx.insert(inventoryListItems).values(
          input.products.map((product) => ({
            createdAt: now,
            id: createLocalId("invli"),
            inventoryListId,
            kolicina: product.kolicina,
            kolicinaExpression: getStoredExpression(product.kolicinaExpression, product.kolicina),
            kraj: product.kraj,
            krajExpression: getStoredExpression(product.krajExpression, product.kraj),
            priceSnapshot: product.priceSnapshot,
            productId: product.productId,
            productNameSnapshot: product.productNameSnapshot,
            prodato: product.prodato,
            totalEarning: product.totalEarning,
            isCounterProduct: product.isCounterProduct,
            uneto: product.uneto,
            unetoExpression: getStoredExpression(product.unetoExpression, product.uneto),
            updatedAt: now,
          })),
        );
      }

      if (input.financialEntries.length > 0) {
        await tx.insert(inventoryListFinancialEntries).values(
          input.financialEntries.map((entry) => ({
            amount: entry.amount,
            amountExpression: getStoredExpression(entry.amountExpression, entry.amount),
            behaviorSnapshot: entry.behaviorSnapshot,
            createdAt: now,
            explanation: entry.explanation,
            id: createLocalId("invlf"),
            inventoryListId,
            nameSnapshot: entry.nameSnapshot,
            revenueExpenseId: entry.revenueExpenseId,
            typeSnapshot: entry.typeSnapshot,
            updatedAt: now,
          })),
        );
      }

      for (const product of input.products) {
        const [existingStock] = await tx.select({ id: inventoryItems.id }).from(inventoryItems).where(eq(inventoryItems.productId, product.productId)).limit(1);
        if (existingStock) {
          await tx.update(inventoryItems).set({ quantityOnHand: product.kraj, updatedAt: now }).where(eq(inventoryItems.productId, product.productId));
        } else {
          await tx.insert(inventoryItems).values({
            id: createLocalId("invi"),
            productId: product.productId,
            quantityOnHand: product.kraj,
            updatedAt: now,
          });
        }
      }
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes("inventory_lists_date_shift_unique") || error.message.includes("inventory_lists.date") || error.message.includes("inventory_lists.shift"))) {
      throw new Error(INVENTORY_LIST_DUPLICATE_ERROR);
    }
    throw error;
  }

  const [finishedList] = await db.select().from(inventoryLists).where(eq(inventoryLists.id, inventoryListId)).limit(1);
  return finishedList;
}

export async function listInventoryLists(): Promise<InventoryListSummary[]> {
  const rows = await db
    .select({
      createdAt: inventoryLists.createdAt,
      createdByUserId: inventoryLists.createdByUserId,
      createdByUserName: users.name,
      date: inventoryLists.date,
      dateKey: inventoryLists.dateKey,
      id: inventoryLists.id,
      shift: inventoryLists.shift,
      totalEarn: inventoryLists.totalEarn,
      updatedAt: inventoryLists.updatedAt,
    })
    .from(inventoryLists)
    .innerJoin(users, eq(inventoryLists.createdByUserId, users.id))
    .orderBy(desc(inventoryLists.createdAt));

  return rows.map((row) => ({
    ...row,
    createdByUserName: row.createdByUserName || "",
  }));
}

export async function getInventoryList(id: string): Promise<InventoryListDetail | null> {
  const [listRow] = await db
    .select({
      bilans: inventoryLists.bilans,
      createdAt: inventoryLists.createdAt,
      createdByUserId: inventoryLists.createdByUserId,
      createdByUserName: users.name,
      date: inventoryLists.date,
      dateKey: inventoryLists.dateKey,
      id: inventoryLists.id,
      shift: inventoryLists.shift,
      totalEarn: inventoryLists.totalEarn,
      totalExpenses: inventoryLists.totalExpenses,
      totalProductEarnings: inventoryLists.totalProductEarnings,
      totalRevenues: inventoryLists.totalRevenues,
      updatedAt: inventoryLists.updatedAt,
    })
    .from(inventoryLists)
    .innerJoin(users, eq(inventoryLists.createdByUserId, users.id))
    .where(eq(inventoryLists.id, id))
    .limit(1);

  if (!listRow) return null;

  const productRows = await db
    .select({
      categoryName: categories.name,
      item: inventoryListItems,
      position: productTable.position,
      unitName: units.name,
    })
    .from(inventoryListItems)
    .leftJoin(productTable, eq(inventoryListItems.productId, productTable.id))
    .leftJoin(categories, eq(productTable.categoryId, categories.id))
    .leftJoin(units, eq(productTable.unitId, units.id))
    .where(eq(inventoryListItems.inventoryListId, id));
  const financialRows = await db.select().from(inventoryListFinancialEntries).where(eq(inventoryListFinancialEntries.inventoryListId, id));

  const products: InventoryListProductDetail[] = productRows.map((row) => ({
    categoryName: row.categoryName ?? "",
    id: row.item.id,
    inventoryListId: row.item.inventoryListId,
    kolicina: row.item.kolicina,
    kolicinaExpression: getStoredExpression(row.item.kolicinaExpression, row.item.kolicina),
    kraj: row.item.kraj,
    krajExpression: getStoredExpression(row.item.krajExpression, row.item.kraj),
    position: row.position ?? 0,
    priceSnapshot: row.item.priceSnapshot,
    productId: row.item.productId,
    productNameSnapshot: row.item.productNameSnapshot,
    prodato: row.item.prodato,
    totalEarning: row.item.totalEarning,
    isCounterProduct: Boolean(row.item.isCounterProduct),
    uneto: row.item.uneto,
    unetoExpression: getStoredExpression(row.item.unetoExpression, row.item.uneto),
    unitName: row.unitName ?? "",
  }));

  const financialEntries: InventoryListFinancialEntryDetail[] = financialRows.map((row) => ({
    amount: row.amount,
    amountExpression: getStoredExpression(row.amountExpression, row.amount),
    behaviorSnapshot: row.behaviorSnapshot,
    explanation: row.explanation,
    id: row.id,
    inventoryListId: row.inventoryListId,
    nameSnapshot: row.nameSnapshot,
    revenueExpenseId: row.revenueExpenseId,
    typeSnapshot: row.typeSnapshot,
  }));

  return {
    ...listRow,
    createdByUserName: listRow.createdByUserName || "",
    financialEntries,
    products,
  };
}

export async function updateInventoryList(input: UpdateInventoryListInput): Promise<InventoryListDetail> {
  if (await inventoryListExistsForOtherList(input.id, input.dateKey, input.shift)) {
    throw new Error(INVENTORY_LIST_DUPLICATE_ERROR);
  }

  const now = new Date().toISOString();
  const shouldUpdateCurrentStock = await isLatestInventoryList(input.id);
  const totalProductEarnings = input.products.reduce((total, product) => total + product.totalEarning, 0);
  const totalRevenues = input.financialEntries.reduce((total, entry) => entry.typeSnapshot === "revenue" ? total + entry.amount : total, 0);
  const totalExpenses = input.financialEntries.reduce((total, entry) => entry.typeSnapshot === "expense" ? total + entry.amount : total, 0);
  const bilans = totalRevenues - totalExpenses;
  const totalEarn = totalProductEarnings + bilans;

  await db.transaction(async (tx) => {
    await tx
      .update(inventoryLists)
      .set({
        bilans,
        date: input.date,
        dateKey: input.dateKey,
        shift: input.shift,
        totalEarn,
        totalExpenses,
        totalProductEarnings,
        totalRevenues,
        updatedAt: now,
      })
      .where(eq(inventoryLists.id, input.id));

    for (const product of input.products) {
      await tx
        .update(inventoryListItems)
        .set({
          kolicina: product.kolicina,
          kolicinaExpression: getStoredExpression(product.kolicinaExpression, product.kolicina),
          kraj: product.kraj,
          krajExpression: getStoredExpression(product.krajExpression, product.kraj),
          prodato: product.prodato,
          totalEarning: product.totalEarning,
          isCounterProduct: product.isCounterProduct,
          uneto: product.uneto,
          unetoExpression: getStoredExpression(product.unetoExpression, product.uneto),
          updatedAt: now,
        })
        .where(and(eq(inventoryListItems.id, product.id), eq(inventoryListItems.inventoryListId, input.id)));

      if (shouldUpdateCurrentStock) {
        const [existingStock] = await tx.select({ id: inventoryItems.id }).from(inventoryItems).where(eq(inventoryItems.productId, product.productId)).limit(1);
        if (existingStock) {
          await tx.update(inventoryItems).set({ quantityOnHand: product.kraj, updatedAt: now }).where(eq(inventoryItems.productId, product.productId));
        } else {
          await tx.insert(inventoryItems).values({
            id: createLocalId("invi"),
            productId: product.productId,
            quantityOnHand: product.kraj,
            updatedAt: now,
          });
        }
      }
    }

    for (const entry of input.financialEntries) {
      await tx
        .update(inventoryListFinancialEntries)
        .set({
          amount: entry.amount,
          amountExpression: getStoredExpression(entry.amountExpression, entry.amount),
          explanation: entry.explanation,
          updatedAt: now,
        })
        .where(and(eq(inventoryListFinancialEntries.id, entry.id), eq(inventoryListFinancialEntries.inventoryListId, input.id)));
    }
  });

  const updatedList = await getInventoryList(input.id);
  if (!updatedList) throw new Error("INVENTORY_LIST_NOT_FOUND");
  return updatedList;
}

export async function deleteInventoryList(id: string): Promise<void> {
  const listToDelete = await getInventoryList(id);
  if (!listToDelete) throw new Error("INVENTORY_LIST_NOT_FOUND");
  const shouldRestoreCurrentStock = await isLatestInventoryList(id);
  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    if (shouldRestoreCurrentStock) {
      for (const product of listToDelete.products) {
        const [previousItem] = await tx
          .select({ kraj: inventoryListItems.kraj })
          .from(inventoryListItems)
          .innerJoin(inventoryLists, eq(inventoryListItems.inventoryListId, inventoryLists.id))
          .where(and(eq(inventoryListItems.productId, product.productId), ne(inventoryLists.id, id)))
          .orderBy(desc(inventoryLists.createdAt))
          .limit(1);

        const restoredQuantity = previousItem?.kraj ?? 0;
        const [existingStock] = await tx.select({ id: inventoryItems.id }).from(inventoryItems).where(eq(inventoryItems.productId, product.productId)).limit(1);
        if (existingStock) {
          await tx.update(inventoryItems).set({ quantityOnHand: restoredQuantity, updatedAt: now }).where(eq(inventoryItems.productId, product.productId));
        } else {
          await tx.insert(inventoryItems).values({ id: createLocalId("invi"), productId: product.productId, quantityOnHand: restoredQuantity, updatedAt: now });
        }
      }
    }

    await tx.delete(inventoryNotifications).where(eq(inventoryNotifications.inventoryListId, id));
    await tx.delete(inventoryListFinancialEntries).where(eq(inventoryListFinancialEntries.inventoryListId, id));
    await tx.delete(inventoryListItems).where(eq(inventoryListItems.inventoryListId, id));
    await tx.delete(inventoryLists).where(eq(inventoryLists.id, id));
  });
}
