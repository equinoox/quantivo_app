import { SyncRecord, SyncResult } from "@/shared/lib/sync/sync.types";

export interface SyncAdapter {
  push(records: SyncRecord[]): Promise<SyncResult>;
  pull(since?: string): Promise<SyncRecord[]>;
}
