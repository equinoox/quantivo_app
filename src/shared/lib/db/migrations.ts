import { sqlite } from "@/shared/lib/db/client";

export async function runMigrations(): Promise<void> {
  // Future versions should replace this with tracked Drizzle migrations.
  await sqlite.execAsync("PRAGMA foreign_keys = ON;");
}
