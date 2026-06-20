import { CustomFinancialEntry, FinanceGraphRow, FinanceInsightEntry, FinanceTotals, InventoryFinanceResult } from "@/features/finance/types/finance.types";
import { FinancialItemBehavior, FinancialItemType } from "@/features/finance/types/financial-item.types";

export type FinanceInsightFilters = {
  behaviorFilter: "all" | FinancialItemBehavior;
  fromDateKey: string | null;
  isDateRangeInvalid: boolean;
  toDateKey: string | null;
  typeFilter: "all" | FinancialItemType;
};

export function createFinanceInsightEntries({
  customEntries,
  getInventoryDateKey,
  getInventoryShiftLabel,
  inventoryResults,
  inventoryResultName,
}: {
  customEntries: CustomFinancialEntry[];
  getInventoryDateKey: (date: string) => string | null;
  getInventoryShiftLabel: (shift: InventoryFinanceResult["shift"]) => string;
  inventoryResults: InventoryFinanceResult[];
  inventoryResultName: string;
}): FinanceInsightEntry[] {
  const customRows: FinanceInsightEntry[] = customEntries.map((entry) => ({
    amount: entry.amount,
    behavior: entry.behavior,
    date: entry.date,
    dateKey: entry.dateKey,
    explanation: entry.explanation,
    id: entry.id,
    name: entry.name,
    source: "custom",
    type: entry.type,
  }));

  const inventoryRows: FinanceInsightEntry[] = inventoryResults.map((entry) => {
    const type: FinancialItemType = entry.totalEarn >= 0 ? "revenue" : "expense";
    return {
      amount: Math.abs(entry.totalEarn),
      behavior: "variable",
      date: entry.date,
      dateKey: entry.dateKey || getInventoryDateKey(entry.date) || entry.createdAt.slice(0, 10),
      explanation: getInventoryShiftLabel(entry.shift),
      id: `inventory-${entry.id}`,
      inventoryListId: entry.id,
      name: inventoryResultName,
      shift: entry.shift,
      source: "inventory",
      type,
    };
  });

  return [...customRows, ...inventoryRows].sort((left, right) => right.dateKey.localeCompare(left.dateKey));
}

export function filterFinanceInsightEntries(entries: FinanceInsightEntry[], filters: FinanceInsightFilters): FinanceInsightEntry[] {
  if (filters.isDateRangeInvalid) return [];
  return entries.filter((entry) => {
    if (filters.typeFilter !== "all" && entry.type !== filters.typeFilter) return false;
    if (filters.behaviorFilter !== "all" && entry.behavior !== filters.behaviorFilter) return false;
    if (filters.fromDateKey && entry.dateKey < filters.fromDateKey) return false;
    if (filters.toDateKey && entry.dateKey > filters.toDateKey) return false;
    return true;
  });
}

export function getFinanceTotals(entries: FinanceInsightEntry[]): FinanceTotals {
  const revenues = entries.reduce((total, entry) => entry.type === "revenue" ? total + entry.amount : total, 0);
  const expenses = entries.reduce((total, entry) => entry.type === "expense" ? total + entry.amount : total, 0);
  return { difference: revenues - expenses, expenses, revenues };
}

export function getFinanceGraphRows(entries: FinanceInsightEntry[]): FinanceGraphRow[] {
  const rows = new Map<string, FinanceGraphRow>();
  for (const entry of entries) {
    const row = rows.get(entry.dateKey) ?? { dateKey: entry.dateKey, expenses: 0, revenues: 0 };
    if (entry.type === "revenue") row.revenues += entry.amount;
    else row.expenses += entry.amount;
    rows.set(entry.dateKey, row);
  }
  return [...rows.values()].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
}
