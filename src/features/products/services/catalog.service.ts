import { and, asc, eq, isNull } from "drizzle-orm";

import { CatalogItem, TaxonomyKind, UnitQuantityType } from "@/features/products/types/product.types";
import { db } from "@/shared/lib/db/client";
import { attributes, categories, productAttributes, products, units } from "@/shared/lib/db/schema";
import { createLocalId } from "@/shared/lib/id/createLocalId";

function createCatalogId(kind: TaxonomyKind): string {
  const prefixByKind: Record<TaxonomyKind, string> = { attributes: "att", categories: "cat", units: "unt" };
  return createLocalId(prefixByKind[kind]);
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function toUnitQuantityType(value: unknown): UnitQuantityType {
  return value === "whole" ? "whole" : "decimal";
}

function toCatalogItem(row: { createdAt: string; deletedAt?: string | null; id: string; name: string; quantityType?: string | null; updatedAt: string }): CatalogItem {
  const item: CatalogItem = {
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
    id: row.id,
    name: row.name,
    updatedAt: row.updatedAt,
  };
  if ("quantityType" in row) item.quantityType = toUnitQuantityType(row.quantityType);
  return item;
}

export async function listCatalogItems(kind: TaxonomyKind): Promise<CatalogItem[]> {
  if (kind === "attributes") {
    const rows = await db.select().from(attributes).where(isNull(attributes.deletedAt)).orderBy(asc(attributes.name));
    return rows.map(toCatalogItem);
  }
  if (kind === "units") {
    const rows = await db.select().from(units).where(isNull(units.deletedAt)).orderBy(asc(units.name));
    return rows.map(toCatalogItem);
  }
  const rows = await db.select().from(categories).where(isNull(categories.deletedAt)).orderBy(asc(categories.name));
  return rows.map(toCatalogItem);
}

export async function createCatalogItem(kind: TaxonomyKind, name: string, options: { quantityType?: UnitQuantityType } = {}): Promise<CatalogItem> {
  const normalizedName = name.trim().replace(/\s+/g, " ");
  const existingItems = await listCatalogItems(kind);
  if (existingItems.some((item) => normalizeName(item.name) === normalizeName(normalizedName))) {
    throw new Error("CATALOG_DUPLICATE_NAME");
  }

  const now = new Date().toISOString();
  const id = createCatalogId(kind);
  const values = { createdAt: now, id, name: normalizedName, updatedAt: now };

  if (kind === "attributes") await db.insert(attributes).values(values);
  else if (kind === "units") await db.insert(units).values({ ...values, quantityType: options.quantityType ?? "decimal" });
  else await db.insert(categories).values({ ...values, position: 0 });

  const [createdItem] = kind === "attributes"
    ? await db.select().from(attributes).where(eq(attributes.id, id)).limit(1)
    : kind === "units"
      ? await db.select().from(units).where(eq(units.id, id)).limit(1)
      : await db.select().from(categories).where(eq(categories.id, id)).limit(1);

  return toCatalogItem(createdItem);
}

async function isCatalogItemUsed(kind: TaxonomyKind, id: string): Promise<boolean> {
  if (kind === "categories") {
    const [product] = await db.select({ id: products.id }).from(products).where(and(eq(products.categoryId, id), isNull(products.deletedAt))).limit(1);
    return Boolean(product);
  }

  if (kind === "units") {
    const [product] = await db.select({ id: products.id }).from(products).where(and(eq(products.unitId, id), isNull(products.deletedAt))).limit(1);
    return Boolean(product);
  }

  const [product] = await db
    .select({ id: products.id })
    .from(productAttributes)
    .innerJoin(products, eq(productAttributes.productId, products.id))
    .where(and(eq(productAttributes.attributeId, id), isNull(products.deletedAt)))
    .limit(1);
  return Boolean(product);
}

export async function deleteCatalogItem(kind: TaxonomyKind, id: string): Promise<void> {
  if (await isCatalogItemUsed(kind, id)) {
    throw new Error("CATALOG_ITEM_IN_USE");
  }

  const now = new Date().toISOString();
  if (kind === "attributes") await db.update(attributes).set({ deletedAt: now, updatedAt: now }).where(eq(attributes.id, id));
  else if (kind === "units") await db.update(units).set({ deletedAt: now, updatedAt: now }).where(eq(units.id, id));
  else await db.update(categories).set({ deletedAt: now, updatedAt: now }).where(eq(categories.id, id));
}
