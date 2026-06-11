export type InventoryTransactionType = "opening_count" | "restock" | "sale_count" | "adjustment" | "waste";
export type InventoryItem = { id: string; productId: string; quantityOnHand: number };
