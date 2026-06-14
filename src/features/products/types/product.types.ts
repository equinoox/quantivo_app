export type TaxonomyKind = "attributes" | "units" | "categories";

export type UnitQuantityType = "whole" | "decimal";

export type CatalogItem = {
  id: string;
  name: string;
  quantityType?: UnitQuantityType;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  categoryId: string;
  categoryName: string;
  unitId: string;
  unitName: string;
  unitQuantityType: UnitQuantityType;
  attributes: CatalogItem[];
  isCounterProduct: boolean;
  minimumQuantityAlert: number;
  position: number;
  price: number;
  quantityOnHand: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type ProductInput = {
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId: string;
  unitId: string;
  attributeIds: string[];
  isCounterProduct: boolean;
  minimumQuantityAlert: number;
  position: number;
  price: number;
};
