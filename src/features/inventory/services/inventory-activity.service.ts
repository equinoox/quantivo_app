import { desc, inArray } from "drizzle-orm";

import { CreateInventoryActivityInput, InventoryActivity, inventoryActivityTypes } from "@/features/inventory/types/inventory-activity.types";
import { db } from "@/shared/lib/db/client";
import { inventoryNotifications } from "@/shared/lib/db/schema";
import { createLocalId } from "@/shared/lib/id/createLocalId";

export async function createInventoryActivity(input: CreateInventoryActivityInput): Promise<void> {
  await db.insert(inventoryNotifications).values({
    actorNameSnapshot: input.actorNameSnapshot,
    actorUserId: input.actorUserId,
    createdAt: new Date().toISOString(),
    id: createLocalId("notif"),
    inventoryDate: input.inventoryDate ?? null,
    inventoryListId: input.inventoryListId ?? null,
    productId: input.productId ?? null,
    productNameSnapshot: input.productNameSnapshot ?? null,
    shift: input.shift ?? null,
    type: input.type,
  });
}

export async function listRecentInventoryActivities(limit = 3): Promise<InventoryActivity[]> {
  const rows = await db
    .select({
      actorNameSnapshot: inventoryNotifications.actorNameSnapshot,
      actorUserId: inventoryNotifications.actorUserId,
      createdAt: inventoryNotifications.createdAt,
      id: inventoryNotifications.id,
      inventoryDate: inventoryNotifications.inventoryDate,
      inventoryListId: inventoryNotifications.inventoryListId,
      productId: inventoryNotifications.productId,
      productNameSnapshot: inventoryNotifications.productNameSnapshot,
      shift: inventoryNotifications.shift,
      type: inventoryNotifications.type,
    })
    .from(inventoryNotifications)
    .where(inArray(inventoryNotifications.type, inventoryActivityTypes))
    .orderBy(desc(inventoryNotifications.createdAt))
    .limit(limit);

  return rows.map((row) => ({ ...row, type: row.type as InventoryActivity["type"] }));
}
