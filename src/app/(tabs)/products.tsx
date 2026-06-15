import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import clsx from "clsx";
import { Check, ChevronDown, ChevronUp, ImageIcon, ImagePlus, Package, Pencil, Plus, Search, Trash2 } from "lucide-react-native";

import { getProductCatalogOptions, createProduct, listProducts, softDeleteProducts, updateProduct } from "@/features/products/services/products.service";
import { CatalogItem, Product, ProductInput } from "@/features/products/types/product.types";
import { productSchema } from "@/features/products/validation/product.schemas";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppCard } from "@/shared/components/ui/AppCard";
import { AppInput } from "@/shared/components/ui/AppInput";
import { AppModal } from "@/shared/components/ui/AppModal";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { LoadingState } from "@/shared/components/ui/LoadingState";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useProtectedRoute } from "@/shared/hooks/useProtectedRoute";
import { useResponsiveLayout } from "@/shared/hooks/useResponsiveLayout";
import { useI18n } from "@/shared/i18n/useI18n";
import { useAppFormatters } from "@/features/setup/hooks/useAppFormatters";

type ProductFormState = {
  attributeIds: string[];
  categoryId: string;
  description: string;
  imageUrl: string;
  isCounterProduct: boolean;
  minimumQuantityAlert: string;
  name: string;
  position: string;
  price: string;
  unitId: string;
};

const emptyForm: ProductFormState = {
  attributeIds: [],
  categoryId: "",
  description: "",
  imageUrl: "",
  isCounterProduct: false,
  minimumQuantityAlert: "0",
  name: "",
  position: "0",
  price: "",
  unitId: "",
};

function productToForm(product: Product): ProductFormState {
  return {
    attributeIds: product.attributes.map((attribute) => attribute.id),
    categoryId: product.categoryId,
    description: product.description ?? "",
    imageUrl: product.imageUrl ?? "",
    isCounterProduct: product.isCounterProduct,
    minimumQuantityAlert: product.isCounterProduct ? "0" : product.minimumQuantityAlert.toString(),
    name: product.name,
    position: product.position.toString(),
    price: product.price.toString(),
    unitId: product.unitId,
  };
}

function OptionChip({ isSelected, label, onPress }: { isSelected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("min-h-10 flex-row items-center gap-2 rounded-md border px-3", isSelected ? "border-orange bg-primary" : "border-primary bg-white")}>
      {isSelected ? <Check color={colors.orange} size={15} /> : null}
      <Text className="font-semibold text-secondary_dark">{label}</Text>
    </Pressable>
  );
}

function ProductCheckbox({ isSelected }: { isSelected: boolean }) {
  return (
    <View className={clsx("mt-7 h-6 w-6 items-center justify-center rounded border", isSelected ? "border-orange bg-orange" : "border-slate-300 bg-white")}>
      {isSelected ? <Check color="#ffffff" size={15} /> : null}
    </View>
  );
}

function ToolbarButton({ icon, label, onPress, tone = "neutral" }: { icon: ReactNode; label: string; onPress: () => void; tone?: "danger" | "neutral" }) {
  return (
    <Pressable onPress={onPress} className={clsx("min-h-9 flex-row items-center justify-center gap-2 rounded-md px-3", tone === "danger" ? "bg-red-600" : "border border-primary bg-white")}>
      {icon}
      <Text className={clsx("text-sm font-semibold", tone === "danger" ? "text-white" : "text-secondary_dark")}>{label}</Text>
    </Pressable>
  );
}

function NumberStepper({ disabled = false, keyboardType = "number-pad", label, onChangeText, value }: { disabled?: boolean; keyboardType?: "decimal-pad" | "number-pad"; label: string; onChangeText: (value: string) => void; value: string }) {
  const parsedValue = Number(value.replace(/,/g, "."));
  const currentValue = Number.isFinite(parsedValue) ? parsedValue : 0;
  const updateBy = (delta: number) => {
    if (disabled) return;
    const nextValue = Math.max(0, currentValue + delta);
    onChangeText(keyboardType === "number-pad" ? Math.round(nextValue).toString() : nextValue.toString());
  };

  return (
    <View className="flex-1 gap-1.5">
      <Text numberOfLines={2} className="text-xs font-semibold text-ink">{label}</Text>
      <View className={clsx("flex-row items-stretch overflow-hidden rounded-md border border-primary bg-white", disabled && "bg-slate-100")}>
        <View className="flex-1 justify-center px-2">
          <AppInput editable={!disabled} value={value} onChangeText={onChangeText} keyboardType={keyboardType} className="min-h-9 border-0 bg-transparent px-0 text-sm" />
        </View>
        <View className="w-10 border-l border-primary">
          <Pressable disabled={disabled} accessibilityLabel={`${label} +1`} onPress={() => updateBy(1)} className="h-7 items-center justify-center bg-primary">
            <ChevronUp color={colors.secondaryDark} size={16} />
          </Pressable>
          <View className="h-px bg-white" />
          <Pressable disabled={disabled} accessibilityLabel={`${label} -1`} onPress={() => updateBy(-1)} className="h-7 items-center justify-center bg-primary">
            <ChevronDown color={colors.secondaryDark} size={16} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function ProductsScreen() {
  const { session } = useProtectedRoute();
  const toast = useAppToast();
  const { t } = useI18n();
  const { formatMoney } = useAppFormatters();
  const responsive = useResponsiveLayout();
  const [products, setProducts] = useState<Product[]>([]);
  const [attributes, setAttributes] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [units, setUnits] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isAdmin = session?.user.role === "admin";
  const canCreateProducts = categories.length > 0 && units.length > 0;

  const selectedProducts = useMemo(() => products.filter((product) => selectedIds.includes(product.id)), [products, selectedIds]);

  const getProductErrorMessage = (error: unknown): string | undefined => {
    if (!(error instanceof Error)) return undefined;
    if (error.message === "PRODUCT_DUPLICATE_NAME") return t("productDuplicateName");
    return error.message;
  };

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const [options, productRows] = await Promise.all([getProductCatalogOptions(), listProducts({ categoryId: categoryFilter, search })]);
      setAttributes(options.attributes);
      setCategories(options.categories);
      setUnits(options.units);
      setProducts(productRows);
      setSelectedIds((current) => current.filter((id) => productRows.some((product) => product.id === id)));
    } catch (error) {
      toast.error(t("productsLoadFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, search]);

  useFocusEffect(
    useCallback(() => {
      void loadProducts();
    }, [loadProducts]),
  );

  const updateForm = (field: keyof ProductFormState, value: boolean | string | string[]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateNumericForm = (field: "minimumQuantityAlert" | "position" | "price", value: string) => {
    updateForm(field, value.replace(/[^\d.]/g, ""));
  };

  const updateIntegerForm = (field: "position", value: string) => {
    updateForm(field, value.replace(/\D/g, ""));
  };

  const updateCounterProduct = () => {
    setForm((current) => {
      const nextIsCounterProduct = !current.isCounterProduct;
      return { ...current, isCounterProduct: nextIsCounterProduct, minimumQuantityAlert: nextIsCounterProduct ? "0" : current.minimumQuantityAlert };
    });
  };

  const openCreateForm = () => {
    if (!isAdmin || !canCreateProducts) return;
    setEditingProduct(null);
    setForm(emptyForm);
    setIsFormVisible(true);
  };

  const openEditForm = () => {
    if (!isAdmin || selectedProducts.length !== 1) return;
    const [product] = selectedProducts;
    setEditingProduct(product);
    setForm(productToForm(product));
    setIsFormVisible(true);
  };

  const closeForm = () => {
    setForm(emptyForm);
    setEditingProduct(null);
    setIsFormVisible(false);
  };

  const toggleSelection = (productId: string) => {
    if (!isAdmin) return;
    setSelectedIds((current) => (current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]));
  };

  const toggleAttribute = (attributeId: string) => {
    setForm((current) => ({
      ...current,
      attributeIds: current.attributeIds.includes(attributeId) ? current.attributeIds.filter((id) => id !== attributeId) : [...current.attributeIds, attributeId],
    }));
  };

  const handlePickImage = async () => {
    if (!isAdmin) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error(t("imagePermissionRequired"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled) updateForm("imageUrl", result.assets[0]?.uri ?? "");
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    const parsed = productSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(t("productValidationError"));
      return;
    }

    const input: ProductInput = { ...parsed.data, minimumQuantityAlert: parsed.data.isCounterProduct ? 0 : parsed.data.minimumQuantityAlert };
    try {
      setIsSaving(true);
      if (editingProduct) await updateProduct(editingProduct.id, input);
      else await createProduct(input);
      toast.success(t("productSaved"));
      closeForm();
      await loadProducts();
    } catch (error) {
      toast.error(t("productSaveFailed"), getProductErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!isAdmin || selectedIds.length === 0) return;
    try {
      await softDeleteProducts(selectedIds);
      toast.success(t("productsDeleted"));
      setSelectedIds([]);
      setIsDeleteConfirmVisible(false);
      await loadProducts();
    } catch (error) {
      toast.error(t("productsDeleteFailed"), error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <Screen tabPage icon={<Package color={colors.secondaryDark} size={36} />} title={t("products")} subtitle={t("productsSubtitle")}>
      <View className="gap-4">
        <RevealOnScroll>
          <View className="gap-2">
            {isAdmin ? <AppButton label={t("createProduct")} disabled={!canCreateProducts} onPress={openCreateForm} className="bg-secondary_dark" /> : <Text className="text-sm text-muted">{t("readOnlyProductsMessage")}</Text>}
            {isAdmin && !canCreateProducts ? <Text className="text-sm text-muted">{t("productsMissingCatalogs")}</Text> : null}
          </View>
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <AppCard>
            <View className="flex-row items-center gap-2">
              <Search color={colors.secondary} size={18} />
              <View className="flex-1">
                <AppInput value={search} onChangeText={setSearch} placeholder={t("searchProducts")} />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                <OptionChip isSelected={!categoryFilter} label={t("allCategories")} onPress={() => setCategoryFilter("")} />
                {categories.map((category) => (
                  <OptionChip key={category.id} isSelected={categoryFilter === category.id} label={category.name} onPress={() => setCategoryFilter(category.id)} />
                ))}
              </View>
            </ScrollView>
          </AppCard>
        </RevealOnScroll>

        {isAdmin && selectedIds.length > 0 ? (
          <RevealOnScroll>
            <View className="flex-row flex-wrap items-center justify-between gap-3 rounded-md border border-orange bg-primary px-3 py-2">
              <Text className="flex-1 text-sm font-semibold text-secondary_dark">{t("selectedProducts").replace("{count}", selectedIds.length.toString())}</Text>
              <View className="flex-row flex-wrap gap-2">
                {selectedIds.length === 1 ? <ToolbarButton icon={<Pencil color={colors.secondaryDark} size={15} />} label={t("edit")} onPress={openEditForm} /> : null}
                <ToolbarButton icon={<Trash2 color="#ffffff" size={15} />} label={selectedIds.length === 1 ? t("delete") : t("bulkDelete")} tone="danger" onPress={() => setIsDeleteConfirmVisible(true)} />
              </View>
            </View>
          </RevealOnScroll>
        ) : null}

        {isLoading ? <LoadingState label={t("loadingProducts")} /> : null}

        {!isLoading && products.length === 0 ? (
          <RevealOnScroll>
            <AppCard>
              <EmptyState title={t("productsEmptyTitle")} message={t("productsEmptyMessage")} />
            </AppCard>
          </RevealOnScroll>
        ) : null}

        {!isLoading && products.length > 0 ? (
          <View className="gap-3">
            {products.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              return (
                <RevealOnScroll key={product.id} duration={580}>
                  <Pressable onPress={() => toggleSelection(product.id)} disabled={!isAdmin}>
                    <AppCard className={clsx("border-primary", isSelected && "border-orange bg-primary")}>
                      <View className="flex-row gap-3">
                        {isAdmin ? <ProductCheckbox isSelected={isSelected} /> : null}
                        <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-md bg-primary">
                          {product.imageUrl ? <Image source={{ uri: product.imageUrl }} className="h-full w-full" resizeMode="cover" /> : <ImageIcon color={colors.secondaryDark} size={28} />}
                        </View>
                        <View className="flex-1 gap-2">
                          <View className="flex-row items-start justify-between gap-2">
                            <View className="flex-1 flex-row items-center gap-1">
                              <Text className="flex-shrink text-lg font-semibold text-secondary_dark">{product.name}</Text>
                              {product.isCounterProduct ? <Text className="rounded bg-orange px-1.5 py-0.5 text-xs font-bold text-black">B</Text> : null}
                            </View>
                            {isSelected ? <Check color={colors.orange} size={20} /> : null}
                          </View>
                          <Text className="text-sm text-secondary">{product.categoryName} / {product.unitName}</Text>
                          {product.attributes.length > 0 ? <Text className="text-sm text-muted">{product.attributes.map((attribute) => attribute.name).join(", ")}</Text> : null}
                          {product.description ? <Text numberOfLines={2} className="text-sm leading-5 text-muted">{product.description}</Text> : null}
                        </View>
                      </View>
                    </AppCard>
                  </Pressable>
                </RevealOnScroll>
              );
            })}
          </View>
        ) : null}
      </View>

      <AppModal visible={isFormVisible} onClose={closeForm}>
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-md bg-primary">
              {editingProduct ? <Package color={colors.secondaryDark} size={20} /> : <Plus color={colors.secondaryDark} size={20} />}
            </View>
            <View className="flex-1">
              <Text className="text-xl font-semibold text-secondary_dark">{editingProduct ? t("editProduct") : t("createProduct")}</Text>
            </View>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: Math.min(500, responsive.window.height - 240) }}>
            <View className="gap-3">
              <AppInput label={t("name")} value={form.name} onChangeText={(value) => updateForm("name", value)} autoCapitalize="words" />
              <AppInput label={t("price")} value={form.price} onChangeText={(value) => updateNumericForm("price", value)} keyboardType="decimal-pad" placeholder={formatMoney(0)} />
              <View className={clsx(responsive.isSmallPhone ? "gap-3" : "flex-row gap-3")}>
                <NumberStepper disabled={form.isCounterProduct} label={t("minimumQuantityAlert")} value={form.minimumQuantityAlert} onChangeText={(value) => updateNumericForm("minimumQuantityAlert", value)} keyboardType="decimal-pad" />
                <NumberStepper label={t("position")} value={form.position} onChangeText={(value) => updateIntegerForm("position", value)} keyboardType="number-pad" />
              </View>
              <Pressable onPress={updateCounterProduct} className={clsx("min-h-12 flex-row items-center gap-3 rounded-md border px-3", form.isCounterProduct ? "border-orange bg-primary" : "border-primary bg-white")}>
                <View className={clsx("h-6 w-6 items-center justify-center rounded border", form.isCounterProduct ? "border-orange bg-orange" : "border-slate-300 bg-white")}>
                  {form.isCounterProduct ? <Check color="#ffffff" size={15} /> : null}
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-secondary_dark">{t("counterProduct")}</Text>
                  <Text className="mt-1 text-xs leading-4 text-muted">{t("counterProductHint")}</Text>
                </View>
              </Pressable>
              <AppInput label={t("description")} value={form.description} onChangeText={(value) => updateForm("description", value)} multiline />
              <View className="gap-2">
                <Text className="text-sm font-medium text-ink">{t("image")}</Text>
                <View className="flex-row flex-wrap items-center gap-3">
                  <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-md bg-primary">
                    {form.imageUrl ? <Image source={{ uri: form.imageUrl }} className="h-full w-full" resizeMode="cover" /> : <ImageIcon color={colors.secondaryDark} size={28} />}
                  </View>
                  <View className="flex-1 gap-2">
                    <ToolbarButton icon={<ImagePlus color={colors.secondaryDark} size={15} />} label={t("selectImage")} onPress={handlePickImage} />
                    {form.imageUrl ? <ToolbarButton icon={<Trash2 color="#ffffff" size={15} />} label={t("removeImage")} tone="danger" onPress={() => updateForm("imageUrl", "")} /> : null}
                  </View>
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium text-ink">{t("category")}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {categories.map((category) => <OptionChip key={category.id} isSelected={form.categoryId === category.id} label={category.name} onPress={() => updateForm("categoryId", category.id)} />)}
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium text-ink">{t("unit")}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {units.map((unit) => <OptionChip key={unit.id} isSelected={form.unitId === unit.id} label={unit.name} onPress={() => updateForm("unitId", unit.id)} />)}
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium text-ink">{t("attributes")}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {attributes.length === 0 ? <Text className="text-sm text-muted">{t("attributesOptionalEmpty")}</Text> : null}
                  {attributes.map((attribute) => <OptionChip key={attribute.id} isSelected={form.attributeIds.includes(attribute.id)} label={attribute.name} onPress={() => toggleAttribute(attribute.id)} />)}
                </View>
              </View>
            </View>
          </ScrollView>

          <View className="gap-2 pt-1">
            <AppButton label={editingProduct ? t("saveChanges") : t("createProduct")} loading={isSaving} onPress={handleSave} className="bg-secondary_dark" />
            <AppButton label={t("cancel")} variant="secondary" onPress={closeForm} />
          </View>
        </View>
      </AppModal>

      <ConfirmDialog destructive visible={isDeleteConfirmVisible} title={t("deleteProductsTitle")} message={t("deleteProductsMessage")} cancelLabel={t("cancel")} confirmLabel={t("delete")} onCancel={() => setIsDeleteConfirmVisible(false)} onConfirm={handleDeleteSelected} />
    </Screen>
  );
}
