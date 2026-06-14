import { desc } from "drizzle-orm";

import { CreateInventoryFieldChangeNotificationInput, CreateShiftFinishedNotificationInput, InventoryNotification } from "@/features/notifications/types/notification.types";
import { db } from "@/shared/lib/db/client";
import { inventoryNotifications } from "@/shared/lib/db/schema";

function createLocalId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

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
  return db.select().from(inventoryNotifications).orderBy(desc(inventoryNotifications.createdAt)).limit(limit).offset(offset);
}
