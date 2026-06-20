import { getInventoryDateKey } from "@/features/inventory/lib/inventory-calculations";

export function getDateKey(value: string, dateFormat: string): string | null {
  return getInventoryDateKey(value, dateFormat);
}

export function isFinanceDateRangeInvalid(fromDate: string, toDate: string, fromDateKey: string | null, toDateKey: string | null): boolean {
  return Boolean(fromDate.trim() && !fromDateKey) || Boolean(toDate.trim() && !toDateKey) || Boolean(fromDateKey && toDateKey && fromDateKey > toDateKey);
}
