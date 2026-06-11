export type ProductUnit = "piece" | "liter" | "kilogram" | "other";
export type Product = { id: string; name: string; unit: ProductUnit; salePrice: number };
