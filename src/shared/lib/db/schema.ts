import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "manager", "worker"] }).notNull().default("worker"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").references(() => categories.id),
  name: text("name").notNull(),
  sku: text("sku"),
  barcode: text("barcode"),
  unit: text("unit", { enum: ["piece", "liter", "kilogram", "other"] }).notNull().default("piece"),
  salePrice: real("sale_price").notNull().default(0),
  reorderPoint: real("reorder_point").notNull().default(0),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const inventoryItems = sqliteTable("inventory_items", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  quantityOnHand: real("quantity_on_hand").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const inventoryTransactions = sqliteTable("inventory_transactions", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  userId: text("user_id").references(() => users.id),
  type: text("type", { enum: ["opening_count", "restock", "sale_count", "adjustment", "waste"] }).notNull(),
  quantityDelta: real("quantity_delta").notNull(),
  note: text("note"),
  occurredAt: text("occurred_at").notNull(),
});
