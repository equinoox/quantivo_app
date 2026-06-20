import { InventoryListShift } from "@/features/inventory/types/inventory.types";

export const inventoryActivityTypes = ["inventory_list_created", "inventory_list_updated", "inventory_list_exported", "product_created", "product_updated", "product_deleted"] as const;

export type InventoryActivityType = (typeof inventoryActivityTypes)[number];

export type InventoryActivity = {
  actorNameSnapshot: string;
  actorUserId: string;
  createdAt: string;
  id: string;
  inventoryDate: string | null;
  inventoryListId: string | null;
  productId: string | null;
  productNameSnapshot: string | null;
  shift: InventoryListShift | null;
  type: InventoryActivityType;
};

export type CreateInventoryActivityInput = {
  actorNameSnapshot: string;
  actorUserId: string;
  inventoryDate?: string | null;
  inventoryListId?: string | null;
  productId?: string | null;
  productNameSnapshot?: string | null;
  shift?: InventoryListShift | null;
  type: InventoryActivityType;
};
