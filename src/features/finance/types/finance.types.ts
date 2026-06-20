import { FinancialItemBehavior, FinancialItemType } from "@/features/finance/types/financial-item.types";

export type CustomFinancialEntry = {
  id: string;
  type: FinancialItemType;
  behavior: FinancialItemBehavior;
  name: string;
  amount: number;
  date: string;
  dateKey: string;
  explanation: string;
  createdByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type CreateCustomFinancialEntryInput = {
  type: FinancialItemType;
  behavior: FinancialItemBehavior;
  name: string;
  amount: number;
  date: string;
  dateKey: string;
  explanation: string;
  createdByUserId?: string;
};

export type InventoryFinanceResult = {
  id: string;
  date: string;
  dateKey: string;
  shift: "first" | "second";
  totalEarn: number;
  createdAt: string;
};

export type FinanceInsightEntry = {
  id: string;
  source: "custom" | "inventory";
  type: FinancialItemType;
  behavior: FinancialItemBehavior;
  name: string;
  amount: number;
  date: string;
  dateKey: string;
  explanation: string;
  inventoryListId?: string;
  shift?: "first" | "second";
};

export type FinanceTotals = {
  difference: number;
  expenses: number;
  revenues: number;
};

export type FinanceGraphRow = {
  dateKey: string;
  expenses: number;
  revenues: number;
};

export type FinanceTypeFilter = "all" | FinancialItemType;
export type FinanceBehaviorFilter = "all" | FinancialItemBehavior;
export type FinanceInsightMode = "list" | "graph";

export type FinancialItemFormState = {
  behavior: FinancialItemBehavior;
  name: string;
  requiresExplanation: boolean;
  type: FinancialItemType;
};

export type CustomEntryFormState = {
  amount: string;
  behavior: FinancialItemBehavior;
  date: string;
  explanation: string;
  name: string;
  type: FinancialItemType;
};

export const emptyFinancialItemForm: FinancialItemFormState = {
  behavior: "fixed",
  name: "",
  requiresExplanation: false,
  type: "expense",
};

export function createEmptyCustomEntryForm(date: string): CustomEntryFormState {
  return {
    amount: "",
    behavior: "variable",
    date,
    explanation: "",
    name: "",
    type: "expense",
  };
}
