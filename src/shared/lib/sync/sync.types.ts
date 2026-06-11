export type SyncEntity = "users" | "products" | "categories" | "inventory_items" | "inventory_transactions";
export type SyncOperation = "create" | "update" | "delete";
export type SyncRecord = { id: string; entity: SyncEntity; operation: SyncOperation; updatedAt: string };
export type SyncResult = { pushed: number; pulled: number; conflicts: number };
