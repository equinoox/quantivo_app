import { desc, eq, inArray, isNull } from "drizzle-orm";

import { listCatalogItems } from "@/features/inventory/products/services/catalog.service";
import { CatalogItem, Product, ProductInput, UnitQuantityType } from "@/features/inventory/products/types/product.types";
import { db } from "@/shared/lib/db/client";
import { attributes, categories, inventoryItems, productAttributes, products, units } from "@/shared/lib/db/schema";
import { createLocalId } from "@/shared/lib/id/createLocalId";

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

type ProductRow = typeof products.$inferSelect;

function toUnitQuantityType(value: unknown): UnitQuantityType {
  return value === "whole" ? "whole" : "decimal";
}

export async function getProductCatalogOptions(): Promise<{ attributes: CatalogItem[]; categories: CatalogItem[]; units: CatalogItem[] }> {
  const [attributeItems, categoryItems, unitItems] = await Promise.all([listCatalogItems("attributes"), listCatalogItems("categories"), listCatalogItems("units")]);
  return { attributes: attributeItems, categories: categoryItems, units: unitItems };
}

async function getProductAttributesByProductIds(productIds: string[]): Promise<Map<string, CatalogItem[]>> {
  const map = new Map<string, CatalogItem[]>();
  if (productIds.length === 0) return map;

  const rows = await db
    .select({
      attributeCreatedAt: attributes.createdAt,
      attributeDeletedAt: attributes.deletedAt,
      attributeId: attributes.id,
      attributeName: attributes.name,
      attributeUpdatedAt: attributes.updatedAt,
      productId: productAttributes.productId,
    })
    .from(productAttributes)
    .innerJoin(attributes, eq(productAttributes.attributeId, attributes.id))
    .where(inArray(productAttributes.productId, productIds));

  for (const row of rows) {
    if (row.attributeDeletedAt) continue;
    const current = map.get(row.productId) ?? [];
    current.push({
      createdAt: row.attributeCreatedAt,
      deletedAt: row.attributeDeletedAt,
      id: row.attributeId,
      name: row.attributeName,
      updatedAt: row.attributeUpdatedAt,
    });
    map.set(row.productId, current);
  }

  return map;
}

export async function listProducts(filters: { categoryId?: string; search?: string } = {}): Promise<Product[]> {
  const rows = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      product: products,
      unitId: units.id,
      unitName: units.name,
      unitQuantityType: units.quantityType,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(units, eq(products.unitId, units.id))
    .where(isNull(products.deletedAt))
    .orderBy(products.position, desc(products.createdAt));

  const productIds = rows.map((row) => row.product.id);
  const attributeMap = await getProductAttributesByProductIds(productIds);
  const stockRows = productIds.length > 0 ? await db.select().from(inventoryItems).where(inArray(inventoryItems.productId, productIds)) : [];
  const stockMap = new Map(stockRows.map((row) => [row.productId, row.quantityOnHand]));
  const search = filters.search?.trim().toLowerCase();

  return rows
    .filter((row) => !filters.categoryId || row.product.categoryId === filters.categoryId)
    .filter((row) => !search || row.product.name.toLowerCase().includes(search))
    .map((row) => ({
      attributes: attributeMap.get(row.product.id) ?? [],
      categoryId: row.product.categoryId ?? "",
      categoryName: row.categoryName ?? "",
      createdAt: row.product.createdAt,
      deletedAt: row.product.deletedAt,
      description: row.product.description,
      id: row.product.id,
      imageUrl: row.product.imageUrl,
      isCounterProduct: Boolean(row.product.isCounterProduct),
      name: row.product.name,
      minimumQuantityAlert: row.product.reorderPoint,
      position: row.product.position,
      price: row.product.salePrice,
      quantityOnHand: stockMap.get(row.product.id) ?? 0,
      unitId: row.product.unitId ?? "",
      unitName: row.unitName ?? row.product.unit,
      unitQuantityType: toUnitQuantityType(row.unitQuantityType),
      updatedAt: row.product.updatedAt,
    }));
}

async function assertProductNameAvailable(name: string, currentProductId?: string): Promise<void> {
  const rows = await db.select().from(products).where(isNull(products.deletedAt));
  if (rows.some((product) => product.id !== currentProductId && normalizeName(product.name) === normalizeName(name))) {
    throw new Error("PRODUCT_DUPLICATE_NAME");
  }
}

async function replaceProductAttributes(productId: string, attributeIds: string[]): Promise<void> {
  await db.delete(productAttributes).where(eq(productAttributes.productId, productId));
  const uniqueAttributeIds = [...new Set(attributeIds)];
  if (uniqueAttributeIds.length === 0) return;
  await db.insert(productAttributes).values(uniqueAttributeIds.map((attributeId) => ({ attributeId, productId })));
}

function toInsertValues(id: string, input: ProductInput, now: string): ProductRow {
  return {
    barcode: null,
    categoryId: input.categoryId,
    createdAt: now,
    deletedAt: null,
    description: input.description?.trim() || null,
    id,
    imageUrl: input.imageUrl?.trim() || null,
    isCounterProduct: input.isCounterProduct,
    name: input.name.trim(),
    reorderPoint: input.isCounterProduct ? 0 : input.minimumQuantityAlert,
    salePrice: input.price,
    sku: null,
    unit: "piece",
    unitId: input.unitId,
    position: input.position,
    updatedAt: now,
  };
}

export async function createProduct(input: ProductInput): Promise<Product> {
  await assertProductNameAvailable(input.name);
  const now = new Date().toISOString();
  const id = createLocalId("prd");
  await db.insert(products).values(toInsertValues(id, input, now));
  await replaceProductAttributes(id, input.attributeIds);
  const [product] = (await listProducts()).filter((item) => item.id === id);
  return product;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  await assertProductNameAvailable(input.name, id);
  const now = new Date().toISOString();
  await db
    .update(products)
    .set({
      categoryId: input.categoryId,
      description: input.description?.trim() || null,
      imageUrl: input.imageUrl?.trim() || null,
      isCounterProduct: input.isCounterProduct,
      name: input.name.trim(),
      position: input.position,
      reorderPoint: input.isCounterProduct ? 0 : input.minimumQuantityAlert,
      salePrice: input.price,
      unitId: input.unitId,
      updatedAt: now,
    })
    .where(eq(products.id, id));
  await replaceProductAttributes(id, input.attributeIds);
  const [product] = (await listProducts()).filter((item) => item.id === id);
  return product;
}

export async function softDeleteProducts(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const now = new Date().toISOString();
  await db.update(products).set({ deletedAt: now, updatedAt: now }).where(inArray(products.id, ids));
}
