import { SyncAdapter } from "@/shared/lib/sync/sync-adapter";
import { SyncRecord, SyncResult } from "@/shared/lib/sync/sync.types";

export class LocalSyncAdapter implements SyncAdapter {
  async push(records: SyncRecord[]): Promise<SyncResult> { return { pushed: records.length, pulled: 0, conflicts: 0 }; }
  async pull(): Promise<SyncRecord[]> { return []; }
}
