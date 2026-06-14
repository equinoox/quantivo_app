export type FinancialItemType = "expense" | "revenue";
export type FinancialItemBehavior = "fixed" | "variable";

export const financialItemTypes: FinancialItemType[] = ["expense", "revenue"];
export const financialItemBehaviors: FinancialItemBehavior[] = ["fixed", "variable"];

export type FinancialItem = {
  id: string;
  type: FinancialItemType;
  behavior: FinancialItemBehavior;
  name: string;
  requiresExplanation: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type CreateFinancialItemInput = {
  type: FinancialItemType;
  behavior: FinancialItemBehavior;
  name: string;
  requiresExplanation: boolean;
};
