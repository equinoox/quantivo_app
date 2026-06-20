import { desc, inArray } from "drizzle-orm";

import { CreateInventoryFieldChangeNotificationInput, CreateShiftFinishedNotificationInput, InventoryNotification } from "@/features/notifications/types/notification.types";
import { db } from "@/shared/lib/db/client";
import { inventoryNotifications } from "@/shared/lib/db/schema";
import { createLocalId } from "@/shared/lib/id/createLocalId";

const notificationTypes: InventoryNotification["type"][] = ["field_change", "shift_finished"];

export async function createInventoryFieldChangeNotification(input: CreateInventoryFieldChangeNotificationInput): Promise<void> {
  await db.insert(inventoryNotifications).values({
    actorNameSnapshot: input.actorNameSnapshot,
    actorUserId: input.actorUserId,
    columnKey: input.columnKey,
    columnLabelSnapshot: input.columnLabelSnapshot,
    createdAt: new Date().toISOString(),
    id: createLocalId("notif"),
    newValue: input.newValue,
    oldValue: input.oldValue,
    productId: input.productId,
    productNameSnapshot: input.productNameSnapshot,
    type: "field_change",
  });
}

export async function createShiftFinishedNotification(input: CreateShiftFinishedNotificationInput): Promise<void> {
  await db.insert(inventoryNotifications).values({
    actorNameSnapshot: input.actorNameSnapshot,
    actorUserId: input.actorUserId,
    createdAt: new Date().toISOString(),
    id: createLocalId("notif"),
    inventoryDate: input.inventoryDate,
    inventoryListId: input.inventoryListId,
    shift: input.shift,
    type: "shift_finished",
  });
}

export async function listInventoryNotifications({ limit, offset }: { limit: number; offset: number }): Promise<InventoryNotification[]> {
  const rows = await db.select().from(inventoryNotifications).where(inArray(inventoryNotifications.type, notificationTypes)).orderBy(desc(inventoryNotifications.createdAt)).limit(limit).offset(offset);
  return rows.map((row) => ({ ...row, type: row.type as InventoryNotification["type"] }));
}
