import { create } from "zustand";

import { EditableProductField, InventoryGrouping, ProductInventoryState, getInitialProductInventoryValues } from "@/features/inventory/lib/inventory-calculations";
import { Product } from "@/features/products/types/product.types";

type NewInventoryDraftState = {
  grouping: InventoryGrouping;
  productInventoryInputs: ProductInventoryState;
  products: Product[];
  resetProductInventoryInputs: (products: Product[]) => void;
  setGrouping: (grouping: InventoryGrouping) => void;
  setProductInventoryInputs: (updater: ProductInventoryState | ((current: ProductInventoryState) => ProductInventoryState)) => void;
  setProducts: (products: Product[]) => void;
  updateProductInventoryField: (productId: string, field: EditableProductField, value: string) => void;
};

export const useNewInventoryDraftStore = create<NewInventoryDraftState>((set) => ({
  grouping: "unit",
  productInventoryInputs: {},
  products: [],
  resetProductInventoryInputs: (products) => {
    const nextInputs: ProductInventoryState = {};
    for (const product of products) nextInputs[product.id] = getInitialProductInventoryValues(product);
    set({ productInventoryInputs: nextInputs, products });
  },
  setGrouping: (grouping) => set({ grouping }),
  setProductInventoryInputs: (updater) => set((state) => ({ productInventoryInputs: typeof updater === "function" ? updater(state.productInventoryInputs) : updater })),
  setProducts: (products) => set((state) => {
    const nextInputs = { ...state.productInventoryInputs };
    const productIds = new Set(products.map((product) => product.id));
    for (const product of products) {
      if (!nextInputs[product.id]) nextInputs[product.id] = getInitialProductInventoryValues(product);
    }
    for (const productId of Object.keys(nextInputs)) {
      if (!productIds.has(productId)) delete nextInputs[productId];
    }
    return { productInventoryInputs: nextInputs, products };
  }),
  updateProductInventoryField: (productId, field, value) => set((state) => ({
    productInventoryInputs: {
      ...state.productInventoryInputs,
      [productId]: {
        entered: state.productInventoryInputs[productId]?.entered ?? "0",
        end: state.productInventoryInputs[productId]?.end ?? "0",
        quantity: state.productInventoryInputs[productId]?.quantity ?? "0",
        [field]: value,
      },
    },
  })),
}));
