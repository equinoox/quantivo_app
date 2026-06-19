import { sqlite } from "@/shared/lib/db/client";

export const LATEST_SCHEMA_VERSION = 3;

const SCHEMA_VERSION_KEY = "schema_version";

async function ensureAppSettingsTable(): Promise<void> {
  await sqlite.execAsync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export async function getCurrentSchemaVersion(): Promise<number> {
  await ensureAppSettingsTable();
  const row = await sqlite.getFirstAsync<{ value: string }>(`SELECT value FROM app_settings WHERE key = '${SCHEMA_VERSION_KEY}' LIMIT 1;`);
  const version = Number(row?.value);
  return Number.isInteger(version) && version >= 0 ? version : 0;
}

export async function setCurrentSchemaVersion(version: number): Promise<void> {
  await ensureAppSettingsTable();
  const updatedAt = new Date().toISOString();
  await sqlite.execAsync(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES ('${SCHEMA_VERSION_KEY}', '${version}', '${updatedAt}')
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at;
  `);
}

export async function resetDatabase(): Promise<void> {
  await sqlite.execAsync(`
    PRAGMA foreign_keys = OFF;

    DROP TABLE IF EXISTS inventory_list_financial_entries;
    DROP TABLE IF EXISTS inventory_notifications;
    DROP TABLE IF EXISTS inventory_list_items;
    DROP TABLE IF EXISTS inventory_lists;
    DROP TABLE IF EXISTS inventory_transactions;
    DROP TABLE IF EXISTS inventory_items;
    DROP TABLE IF EXISTS product_attributes;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS attributes;
    DROP TABLE IF EXISTS units;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS custom_financial_entries;
    DROP TABLE IF EXISTS financial_items;
    DROP TABLE IF EXISTS workers;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS app_settings;

    PRAGMA foreign_keys = ON;
  `);

  await runMigrations();
}

async function runBaselineSchemaMigration(): Promise<void> {
  await sqlite.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'worker',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT REFERENCES users(id),
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'Worker',
      worker_type TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS financial_items (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      behavior TEXT NOT NULL,
      name TEXT NOT NULL,
      requires_explanation INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS custom_financial_entries (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      behavior TEXT NOT NULL DEFAULT 'variable',
      name TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      date_key TEXT NOT NULL,
      explanation TEXT NOT NULL DEFAULT '',
      created_by_user_id TEXT REFERENCES users(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      quantity_type TEXT NOT NULL DEFAULT 'decimal',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS attributes (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      category_id TEXT REFERENCES categories(id),
      unit_id TEXT REFERENCES units(id),
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      sku TEXT,
      barcode TEXT,
      unit TEXT NOT NULL DEFAULT 'piece',
      sale_price REAL NOT NULL DEFAULT 0,
      reorder_point REAL NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      is_counter_product INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS product_attributes (
      product_id TEXT NOT NULL REFERENCES products(id),
      attribute_id TEXT NOT NULL REFERENCES attributes(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY NOT NULL,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity_on_hand REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id TEXT PRIMARY KEY NOT NULL,
      product_id TEXT NOT NULL REFERENCES products(id),
      user_id TEXT REFERENCES users(id),
      type TEXT NOT NULL,
      quantity_delta REAL NOT NULL,
      note TEXT,
      occurred_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_lists (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      shift TEXT NOT NULL,
      created_by_user_id TEXT NOT NULL REFERENCES users(id),
      total_product_earnings REAL NOT NULL DEFAULT 0,
      total_revenues REAL NOT NULL DEFAULT 0,
      total_expenses REAL NOT NULL DEFAULT 0,
      bilans REAL NOT NULL DEFAULT 0,
      total_earn REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS inventory_lists_date_shift_unique
      ON inventory_lists(date, shift);

    CREATE TABLE IF NOT EXISTS inventory_list_items (
      id TEXT PRIMARY KEY NOT NULL,
      inventory_list_id TEXT NOT NULL REFERENCES inventory_lists(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name_snapshot TEXT NOT NULL,
      uneto REAL NOT NULL DEFAULT 0,
      uneto_expression TEXT NOT NULL DEFAULT '',
      kolicina REAL NOT NULL DEFAULT 0,
      kolicina_expression TEXT NOT NULL DEFAULT '',
      kraj REAL NOT NULL DEFAULT 0,
      kraj_expression TEXT NOT NULL DEFAULT '',
      prodato REAL NOT NULL DEFAULT 0,
      price_snapshot REAL NOT NULL DEFAULT 0,
      total_earning REAL NOT NULL DEFAULT 0,
      is_counter_product INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_list_financial_entries (
      id TEXT PRIMARY KEY NOT NULL,
      inventory_list_id TEXT NOT NULL REFERENCES inventory_lists(id),
      revenue_expense_id TEXT NOT NULL REFERENCES financial_items(id),
      name_snapshot TEXT NOT NULL,
      type_snapshot TEXT NOT NULL,
      behavior_snapshot TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      amount_expression TEXT NOT NULL DEFAULT '',
      explanation TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_notifications (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      actor_user_id TEXT NOT NULL REFERENCES users(id),
      actor_name_snapshot TEXT NOT NULL,
      product_id TEXT,
      product_name_snapshot TEXT,
      column_key TEXT,
      column_label_snapshot TEXT,
      old_value REAL,
      new_value REAL,
      inventory_list_id TEXT,
      inventory_date TEXT,
      shift TEXT,
      created_at TEXT NOT NULL
    );
  `);

  const workerColumns = await sqlite.getAllAsync<{ name: string }>("PRAGMA table_info(workers)");
  if (!workerColumns.some((column) => column.name === "user_id")) {
    await sqlite.execAsync("ALTER TABLE workers ADD COLUMN user_id TEXT REFERENCES users(id);");
  }

  const financialItemColumns = await sqlite.getAllAsync<{ name: string }>("PRAGMA table_info(financial_items)");
  if (!financialItemColumns.some((column) => column.name === "requires_explanation")) {
    await sqlite.execAsync("ALTER TABLE financial_items ADD COLUMN requires_explanation INTEGER NOT NULL DEFAULT 0;");
  }

  const inventoryListFinancialEntryColumns = await sqlite.getAllAsync<{ name: string }>("PRAGMA table_info(inventory_list_financial_entries)");
  if (!inventoryListFinancialEntryColumns.some((column) => column.name === "explanation")) {
    await sqlite.execAsync("ALTER TABLE inventory_list_financial_entries ADD COLUMN explanation TEXT NOT NULL DEFAULT '';");
  }
  if (!inventoryListFinancialEntryColumns.some((column) => column.name === "amount_expression")) {
    await sqlite.execAsync("ALTER TABLE inventory_list_financial_entries ADD COLUMN amount_expression TEXT NOT NULL DEFAULT '';");
  }

  const inventoryListItemColumns = await sqlite.getAllAsync<{ name: string }>("PRAGMA table_info(inventory_list_items)");
  if (!inventoryListItemColumns.some((column) => column.name === "uneto_expression")) {
    await sqlite.execAsync("ALTER TABLE inventory_list_items ADD COLUMN uneto_expression TEXT NOT NULL DEFAULT '';");
  }
  if (!inventoryListItemColumns.some((column) => column.name === "kolicina_expression")) {
    await sqlite.execAsync("ALTER TABLE inventory_list_items ADD COLUMN kolicina_expression TEXT NOT NULL DEFAULT '';");
  }
  if (!inventoryListItemColumns.some((column) => column.name === "kraj_expression")) {
    await sqlite.execAsync("ALTER TABLE inventory_list_items ADD COLUMN kraj_expression TEXT NOT NULL DEFAULT '';");
  }
  if (!inventoryListItemColumns.some((column) => column.name === "is_counter_product")) {
    await sqlite.execAsync("ALTER TABLE inventory_list_items ADD COLUMN is_counter_product INTEGER NOT NULL DEFAULT 0;");
  }

  const categoryColumns = await sqlite.getAllAsync<{ name: string }>("PRAGMA table_info(categories)");
  if (!categoryColumns.some((column) => column.name === "deleted_at")) {
    await sqlite.execAsync("ALTER TABLE categories ADD COLUMN deleted_at TEXT;");
  }

  const unitColumns = await sqlite.getAllAsync<{ name: string }>("PRAGMA table_info(units)");
  if (!unitColumns.some((column) => column.name === "quantity_type")) {
    await sqlite.execAsync("ALTER TABLE units ADD COLUMN quantity_type TEXT NOT NULL DEFAULT 'decimal';");
  }

  const productColumns = await sqlite.getAllAsync<{ name: string }>("PRAGMA table_info(products)");
  if (!productColumns.some((column) => column.name === "unit_id")) {
    await sqlite.execAsync("ALTER TABLE products ADD COLUMN unit_id TEXT REFERENCES units(id);");
  }
  if (!productColumns.some((column) => column.name === "description")) {
    await sqlite.execAsync("ALTER TABLE products ADD COLUMN description TEXT;");
  }
  if (!productColumns.some((column) => column.name === "image_url")) {
    await sqlite.execAsync("ALTER TABLE products ADD COLUMN image_url TEXT;");
  }
  if (!productColumns.some((column) => column.name === "is_counter_product")) {
    await sqlite.execAsync("ALTER TABLE products ADD COLUMN is_counter_product INTEGER NOT NULL DEFAULT 0;");
  }
}

async function runCustomFinancialEntriesMigration(): Promise<void> {
  await sqlite.execAsync(`
    CREATE TABLE IF NOT EXISTS custom_financial_entries (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      behavior TEXT NOT NULL DEFAULT 'variable',
      name TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      date_key TEXT NOT NULL,
      explanation TEXT NOT NULL DEFAULT '',
      created_by_user_id TEXT REFERENCES users(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);
}

async function runCustomFinancialEntryBehaviorMigration(): Promise<void> {
  const customEntryColumns = await sqlite.getAllAsync<{ name: string }>("PRAGMA table_info(custom_financial_entries)");
  if (!customEntryColumns.some((column) => column.name === "behavior")) {
    await sqlite.execAsync("ALTER TABLE custom_financial_entries ADD COLUMN behavior TEXT NOT NULL DEFAULT 'variable';");
  }
}

export async function runVersionedMigrations(): Promise<void> {
  await sqlite.execAsync("PRAGMA foreign_keys = ON;");

  const currentVersion = await getCurrentSchemaVersion();
  if (currentVersion < LATEST_SCHEMA_VERSION) {
    await runBaselineSchemaMigration();
    if (currentVersion < 2) await runCustomFinancialEntriesMigration();
    if (currentVersion < 3) await runCustomFinancialEntryBehaviorMigration();
    await setCurrentSchemaVersion(LATEST_SCHEMA_VERSION);
  }
}

export async function runMigrations(): Promise<void> {
  await runVersionedMigrations();
}
