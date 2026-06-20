import { Product } from "@/features/inventory/products/types/product.types";

export type InventoryGrouping = "category" | "unit";
export type InventoryShift = "first" | "second";
export type EditableProductField = "entered" | "quantity" | "end";
export type ProductInventoryState = Record<string, Record<EditableProductField, string>>;
export type ProductField = "kolicina" | "uneto" | "kraj";
export type ProductExpressionField = "kolicinaExpression" | "unetoExpression" | "krajExpression";

export function evaluateInventoryExpression(expression: string): number | null {
  const normalizedExpression = expression.replace(/,/g, ".").replace(/\s/g, "");
  if (!normalizedExpression) return null;
  if (!/^\d+(\.\d+)?([+-]\d+(\.\d+)?)*$/.test(normalizedExpression)) return null;
  const values = normalizedExpression.match(/[+-]?\d+(\.\d+)?/g)?.map((part) => Number(part)) ?? [];
  if (values.some((value) => Number.isNaN(value))) return null;
  return values.reduce((total, value) => total + value, 0);
}

export function sanitizeInventoryExpression(value: string): string {
  return value.replace(/,/g, ".").replace(/[^\d.+-]/g, "");
}

export function sanitizeCalculatorExpression(expression: string): string {
  return expression.replace(/[^\d+\-.,]/g, "");
}

export function parseNonNegativeNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsedValue = Number(value.replace(/,/g, "."));
  if (!Number.isFinite(parsedValue) || parsedValue < 0) return null;
  return parsedValue;
}

export function parseOptionalNonNegativeNumber(value: string): number {
  if (!value.trim()) return 0;
  return parseNonNegativeNumber(value) ?? Number.NaN;
}

export function parseInventoryFieldValue(value: string, fallbackValue: number): number {
  if (!value.trim()) return fallbackValue;
  return evaluateInventoryExpression(value) ?? Number.NaN;
}

export function isValidInventoryDate(value: string, dateFormat: string): boolean {
  const trimmedValue = value.trim();
  let day = 0;
  let month = 0;
  let year = 0;

  if (dateFormat === "yyyy-MM-dd") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);
    if (!match) return false;
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    const separator = dateFormat === "dd.MM.yyyy" ? "\\." : "/";
    const match = new RegExp(`^(\\d{2})${separator}(\\d{2})${separator}(\\d{4})$`).exec(trimmedValue);
    if (!match) return false;
    const firstPart = Number(match[1]);
    const secondPart = Number(match[2]);
    year = Number(match[3]);
    if (dateFormat === "MM/dd/yyyy") {
      month = firstPart;
      day = secondPart;
    } else {
      day = firstPart;
      month = secondPart;
    }
  }

  if (year < 1900 || month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function getInventoryDateKey(value: string, dateFormat: string): string | null {
  const trimmedValue = value.trim();
  if (!isValidInventoryDate(trimmedValue, dateFormat)) return null;

  if (dateFormat === "yyyy-MM-dd") return trimmedValue;

  const separator = dateFormat === "dd.MM.yyyy" ? "." : "/";
  const [first, second, year] = trimmedValue.split(separator).map(Number);
  const month = dateFormat === "MM/dd/yyyy" ? first : second;
  const day = dateFormat === "MM/dd/yyyy" ? second : first;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? value.toString() : value.toString();
}

export function hasInventoryExpression(expression: string): boolean {
  return expression.includes("+") || expression.includes("-");
}

export function getProductExpressionField(field: ProductField): ProductExpressionField {
  if (field === "kolicina") return "kolicinaExpression";
  if (field === "uneto") return "unetoExpression";
  return "krajExpression";
}

export function getInitialProductInventoryValues(product: Product): Record<EditableProductField, string> {
  const quantityOnHand = product.quantityOnHand.toString();
  return { entered: "0", end: quantityOnHand, quantity: quantityOnHand };
}

export function calculateSoldValue({ end, entered, isCounterProduct, quantity }: { end: number; entered: number; isCounterProduct: boolean; quantity: number }): number {
  return isCounterProduct ? end - quantity : quantity + entered - end;
}

export function calculateTotalEarning(sold: number, price: number): number {
  return sold * price;
}
