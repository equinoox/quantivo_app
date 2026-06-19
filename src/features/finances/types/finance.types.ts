import { FinancialItemBehavior, FinancialItemType } from "@/features/revenues-expenses/types/financial-item.types";

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
