import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { listCatalogItems } from "@/features/inventory/products/services/catalog.service";
import { listProducts } from "@/features/inventory/products/services/products.service";
import { listRecentInventoryActivities } from "@/features/inventory/services/inventory-activity.service";
import { listInventoryLists } from "@/features/inventory/services/inventory.service";
import { InventoryActivity } from "@/features/inventory/types/inventory-activity.types";

type InventoryOverviewStats = {
  activeLists: number;
  categories: number;
  lowStockItems: number;
  totalProducts: number;
};

const emptyStats: InventoryOverviewStats = {
  activeLists: 0,
  categories: 0,
  lowStockItems: 0,
  totalProducts: 0,
};

export function useInventoryOverview() {
  const [activities, setActivities] = useState<InventoryActivity[]>([]);
  const [stats, setStats] = useState<InventoryOverviewStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasLoadError(false);
      const [lists, products, categories, activityRows] = await Promise.all([listInventoryLists(), listProducts(), listCatalogItems("categories"), listRecentInventoryActivities(3)]);
      setStats({
        activeLists: lists.length,
        categories: categories.length,
        lowStockItems: products.filter((product) => !product.isCounterProduct && product.minimumQuantityAlert > 0 && product.quantityOnHand < product.minimumQuantityAlert).length,
        totalProducts: products.length,
      });
      setActivities(activityRows);
    } catch {
      setHasLoadError(true);
      setStats(emptyStats);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadOverview();
    }, [loadOverview]),
  );

  return { activities, hasLoadError, isLoading, refresh: loadOverview, stats };
}
