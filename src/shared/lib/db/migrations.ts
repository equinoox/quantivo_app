import { sqlite } from "@/shared/lib/db/client";

export async function runMigrations(): Promise<void> {
  // Future versions should replace this with tracked Drizzle migrations.
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
  `);

  const workerColumns = await sqlite.getAllAsync<{ name: string }>("PRAGMA table_info(workers)");
  if (!workerColumns.some((column) => column.name === "user_id")) {
    await sqlite.execAsync("ALTER TABLE workers ADD COLUMN user_id TEXT REFERENCES users(id);");
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
}
