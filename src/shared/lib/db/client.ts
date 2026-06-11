import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";

import * as schema from "@/shared/lib/db/schema";

export const sqlite: SQLiteDatabase = openDatabaseSync("quantivo.db");
export const db = drizzle(sqlite, { schema });
