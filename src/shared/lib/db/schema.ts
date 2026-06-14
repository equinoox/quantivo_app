import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  loginKey: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "manager", "worker"] }).notNull().default("worker"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const workers = sqliteTable("workers", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  role: text("role", { enum: ["Admin", "Manager", "Worker"] }).notNull().default("Worker"),
  workerType: text("worker_type").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const financialItems = sqliteTable("financial_items", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["expense", "revenue"] }).notNull(),
  behavior: text("behavior", { enum: ["fixed", "variable"] }).notNull(),
  name: text("name").notNull(),
  requiresExplanation: integer("requires_explanation", { mode: "boolean" }).notNull().default(false),
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
  deletedAt: text("deleted_at"),
});

export const units = sqliteTable("units", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  quantityType: text("quantity_type", { enum: ["whole", "decimal"] }).notNull().default("decimal"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const attributes = sqliteTable("attributes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").references(() => categories.id),
  unitId: text("unit_id").references(() => units.id),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  sku: text("sku"),
  barcode: text("barcode"),
  unit: text("unit", { enum: ["piece", "liter", "kilogram", "other"] }).notNull().default("piece"),
  salePrice: real("sale_price").notNull().default(0),
  reorderPoint: real("reorder_point").notNull().default(0),
  position: integer("position").notNull().default(0),
  isCounterProduct: integer("is_counter_product", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const productAttributes = sqliteTable("product_attributes", {
  productId: text("product_id").notNull().references(() => products.id),
  attributeId: text("attribute_id").notNull().references(() => attributes.id),
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

export const inventoryLists = sqliteTable(
  "inventory_lists",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull(),
    shift: text("shift", { enum: ["first", "second"] }).notNull(),
    createdByUserId: text("created_by_user_id").notNull().references(() => users.id),
    totalProductEarnings: real("total_product_earnings").notNull().default(0),
    totalRevenues: real("total_revenues").notNull().default(0),
    totalExpenses: real("total_expenses").notNull().default(0),
    bilans: real("bilans").notNull().default(0),
    totalEarn: real("total_earn").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("inventory_lists_date_shift_unique").on(table.date, table.shift)],
);

export const inventoryListItems = sqliteTable("inventory_list_items", {
  id: text("id").primaryKey(),
  inventoryListId: text("inventory_list_id").notNull().references(() => inventoryLists.id),
  productId: text("product_id").notNull().references(() => products.id),
  productNameSnapshot: text("product_name_snapshot").notNull(),
  uneto: real("uneto").notNull().default(0),
  unetoExpression: text("uneto_expression").notNull().default(""),
  kolicina: real("kolicina").notNull().default(0),
  kolicinaExpression: text("kolicina_expression").notNull().default(""),
  kraj: real("kraj").notNull().default(0),
  krajExpression: text("kraj_expression").notNull().default(""),
  prodato: real("prodato").notNull().default(0),
  priceSnapshot: real("price_snapshot").notNull().default(0),
  totalEarning: real("total_earning").notNull().default(0),
  isCounterProduct: integer("is_counter_product", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const inventoryListFinancialEntries = sqliteTable("inventory_list_financial_entries", {
  id: text("id").primaryKey(),
  inventoryListId: text("inventory_list_id").notNull().references(() => inventoryLists.id),
  revenueExpenseId: text("revenue_expense_id").notNull().references(() => financialItems.id),
  nameSnapshot: text("name_snapshot").notNull(),
  typeSnapshot: text("type_snapshot", { enum: ["expense", "revenue"] }).notNull(),
  behaviorSnapshot: text("behavior_snapshot", { enum: ["fixed", "variable"] }).notNull(),
  amount: real("amount").notNull().default(0),
  amountExpression: text("amount_expression").notNull().default(""),
  explanation: text("explanation").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const inventoryNotifications = sqliteTable("inventory_notifications", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["field_change", "shift_finished"] }).notNull(),
  actorUserId: text("actor_user_id").notNull().references(() => users.id),
  actorNameSnapshot: text("actor_name_snapshot").notNull(),
  productId: text("product_id"),
  productNameSnapshot: text("product_name_snapshot"),
  columnKey: text("column_key", { enum: ["quantity", "entered"] }),
  columnLabelSnapshot: text("column_label_snapshot"),
  oldValue: real("old_value"),
  newValue: real("new_value"),
  inventoryListId: text("inventory_list_id"),
  inventoryDate: text("inventory_date"),
  shift: text("shift", { enum: ["first", "second"] }),
  createdAt: text("created_at").notNull(),
});
