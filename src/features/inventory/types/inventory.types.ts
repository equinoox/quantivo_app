export type InventoryTransactionType = "opening_count" | "restock" | "sale_count" | "adjustment" | "waste";
export type InventoryItem = { id: string; productId: string; quantityOnHand: number };

export type InventoryListShift = "first" | "second";

export type InventoryListFinancialType = "expense" | "revenue";
export type InventoryListFinancialBehavior = "fixed" | "variable";

export type FinishInventoryListProductInput = {
  productId: string;
  productNameSnapshot: string;
  uneto: number;
  unetoExpression: string;
  kolicina: number;
  kolicinaExpression: string;
  kraj: number;
  krajExpression: string;
  prodato: number;
  priceSnapshot: number;
  totalEarning: number;
  isCounterProduct: boolean;
};

export type FinishInventoryListFinancialEntryInput = {
  revenueExpenseId: string;
  nameSnapshot: string;
  typeSnapshot: InventoryListFinancialType;
  behaviorSnapshot: InventoryListFinancialBehavior;
  amount: number;
  amountExpression: string;
  explanation: string;
};

export type InventoryListSummary = {
  id: string;
  date: string;
  shift: InventoryListShift;
  createdByUserId: string;
  createdByUserName: string;
  totalEarn: number;
  createdAt: string;
  updatedAt: string;
};

export type InventoryListProductDetail = FinishInventoryListProductInput & {
  categoryName: string;
  id: string;
  inventoryListId: string;
  position: number;
  unitName: string;
};

export type InventoryListFinancialEntryDetail = FinishInventoryListFinancialEntryInput & {
  id: string;
  inventoryListId: string;
};

export type InventoryListDetail = FinishedInventoryList & {
  createdByUserName: string;
  products: InventoryListProductDetail[];
  financialEntries: InventoryListFinancialEntryDetail[];
};

export type UpdateInventoryListProductInput = InventoryListProductDetail;
export type UpdateInventoryListFinancialEntryInput = InventoryListFinancialEntryDetail;

export type UpdateInventoryListInput = {
  date: string;
  id: string;
  shift: InventoryListShift;
  products: UpdateInventoryListProductInput[];
  financialEntries: UpdateInventoryListFinancialEntryInput[];
};

export type FinishInventoryListInput = {
  date: string;
  shift: InventoryListShift;
  createdByUserId: string;
  products: FinishInventoryListProductInput[];
  financialEntries: FinishInventoryListFinancialEntryInput[];
  totalProductEarnings: number;
  totalRevenues: number;
  totalExpenses: number;
  bilans: number;
  totalEarn: number;
};

export type FinishedInventoryList = {
  id: string;
  date: string;
  shift: InventoryListShift;
  createdByUserId: string;
  totalProductEarnings: number;
  totalRevenues: number;
  totalExpenses: number;
  bilans: number;
  totalEarn: number;
  createdAt: string;
  updatedAt: string;
};
