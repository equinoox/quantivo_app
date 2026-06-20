import { InventoryFinanceResult } from "@/features/finance/types/finance.types";
import { FinancialItemBehavior, FinancialItemType } from "@/features/finance/types/financial-item.types";

export function getFinanceTypeLabel(type: FinancialItemType, t: (key: string) => string): string {
  return type === "expense" ? t("expense") : t("revenue");
}

export function getFinanceBehaviorLabel(behavior: FinancialItemBehavior, t: (key: string) => string): string {
  return behavior === "fixed" ? t("fixed") : t("variable");
}

export function getInventoryShiftLabel(shift: InventoryFinanceResult["shift"], t: (key: string) => string): string {
  return shift === "first" ? t("firstShift") : t("secondShift");
}
