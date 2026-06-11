import { SyncAdapter } from "@/shared/lib/sync/sync-adapter";
import { SyncRecord, SyncResult } from "@/shared/lib/sync/sync.types";

export class RemoteSyncAdapterPlaceholder implements SyncAdapter {
  async push(): Promise<SyncResult> { throw new Error("Remote sync is intentionally not implemented in the scaffold."); }
  async pull(): Promise<SyncRecord[]> { throw new Error("Remote sync is intentionally not implemented in the scaffold."); }
}
