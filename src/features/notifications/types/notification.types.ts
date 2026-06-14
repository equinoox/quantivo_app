import { InventoryListShift } from "@/features/inventory/types/inventory.types";

export type InventoryNotificationType = "field_change" | "shift_finished";
export type InventoryNotificationColumn = "quantity" | "entered";

export type InventoryNotification = {
  actorNameSnapshot: string;
  actorUserId: string;
  columnKey: InventoryNotificationColumn | null;
  columnLabelSnapshot: string | null;
  createdAt: string;
  id: string;
  inventoryDate: string | null;
  inventoryListId: string | null;
  newValue: number | null;
  oldValue: number | null;
  productId: string | null;
  productNameSnapshot: string | null;
  shift: InventoryListShift | null;
  type: InventoryNotificationType;
};

export type CreateInventoryFieldChangeNotificationInput = {
  actorNameSnapshot: string;
  actorUserId: string;
  columnKey: InventoryNotificationColumn;
  columnLabelSnapshot: string;
  newValue: number;
  oldValue: number;
  productId: string;
  productNameSnapshot: string;
};

export type CreateShiftFinishedNotificationInput = {
  actorNameSnapshot: string;
  actorUserId: string;
  inventoryDate: string;
  inventoryListId: string;
  shift: InventoryListShift;
};
