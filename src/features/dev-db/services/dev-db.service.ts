import { sqlite } from "@/shared/lib/db/client";

import { DevDbRow, DevDbTable } from "@/features/dev-db/types/dev-db.types";

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

export async function listDatabaseTables(): Promise<DevDbTable[]> {
  return sqlite.getAllAsync<DevDbTable>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
}

export async function listTableRows(tableName: string, limit = 50): Promise<DevDbRow[]> {
  const tables = await listDatabaseTables();
  const tableExists = tables.some((table) => table.name === tableName);
  if (!tableExists) throw new Error("Unknown database table.");

  const safeLimit = Math.max(1, Math.min(limit, 100));
  return sqlite.getAllAsync<DevDbRow>(`SELECT * FROM ${quoteIdentifier(tableName)} LIMIT ${safeLimit}`);
}
