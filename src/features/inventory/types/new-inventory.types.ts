import { FinancialItem } from "@/features/revenues-expenses/types/financial-item.types";

export type InventoryFinancialEntry = {
  amount: string;
  amountExpression: string;
  behavior: FinancialItem["behavior"];
  explanation: string;
  id: string;
  itemId: string;
  name: string;
  requiresExplanation: boolean;
  type: FinancialItem["type"];
};

export type CalculatorTarget = { entryId: string; expression: string } | null;
