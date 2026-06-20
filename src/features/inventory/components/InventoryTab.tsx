import { router } from "expo-router";
import clsx from "clsx";
import { AlertTriangle, ClipboardList, ListPlus, Package, Pencil, Settings, Tags, Trash2 } from "lucide-react-native";
import type { ReactNode } from "react";
import { Image, Pressable, Text, View, type DimensionValue } from "react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { useInventoryOverview } from "@/features/inventory/hooks/useInventoryOverview";
import { InventoryActivity } from "@/features/inventory/types/inventory-activity.types";
import { TabHeaderActions } from "@/features/notifications/components/TabHeaderActions";
import { AppCard } from "@/shared/components/ui/AppCard";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { routes } from "@/shared/constants/routes";
import { useResponsiveLayout } from "@/shared/hooks/useResponsiveLayout";
import { useI18n } from "@/shared/i18n/useI18n";

const activityColors = {
  blue: "#1d4ed8",
  green: "#059669",
  purple: "#6d5dfc",
  red: "#dc2626",
};

type InventoryStatCardProps = {
  icon: ReactNode;
  label: string;
  value: number;
  width: DimensionValue;
};

type QuickActionCardProps = {
  description: string;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  width: DimensionValue;
};

function formatCount(value: number): string {
  return value.toLocaleString();
}

function replacePlaceholders(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);
}

function formatActivityTime(createdAt: string, t: (key: string) => string): string {
  const createdTime = new Date(createdAt).getTime();
  if (!Number.isFinite(createdTime)) return "";

  const minutes = Math.max(0, Math.floor((Date.now() - createdTime) / 60000));
  if (minutes < 1) return t("justNow");
  if (minutes < 60) return replacePlaceholders(t("minutesAgo"), { count: minutes.toString() });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return replacePlaceholders(t("hoursAgo"), { count: hours.toString() });

  return replacePlaceholders(t("daysAgo"), { count: Math.floor(hours / 24).toString() });
}

function getShiftLabel(activity: InventoryActivity, t: (key: string) => string): string {
  if (!activity.shift) return "";
  return activity.shift === "first" ? t("firstShift") : t("secondShift");
}

function getActivityTitle(activity: InventoryActivity, t: (key: string) => string): string {
  const productName = activity.productNameSnapshot ?? t("products");
  const listDate = activity.inventoryDate ?? t("inventoryLists");

  if (activity.type === "inventory_list_created") return replacePlaceholders(t("inventoryActivityListCreated"), { date: listDate });
  if (activity.type === "inventory_list_updated") return replacePlaceholders(t("inventoryActivityListUpdated"), { date: listDate });
  if (activity.type === "inventory_list_exported") return replacePlaceholders(t("inventoryActivityListExported"), { date: listDate });
  if (activity.type === "product_created") return replacePlaceholders(t("inventoryActivityProductCreated"), { name: productName });
  if (activity.type === "product_updated") return replacePlaceholders(t("inventoryActivityProductUpdated"), { name: productName });
  return replacePlaceholders(t("inventoryActivityProductDeleted"), { name: productName });
}

function getActivitySubtitle(activity: InventoryActivity, t: (key: string) => string): string {
  const actor = replacePlaceholders(t("activityBy"), { name: activity.actorNameSnapshot });
  const shift = getShiftLabel(activity, t);
  return shift ? `${actor} | ${shift}` : actor;
}

function getActivityIcon(activity: InventoryActivity) {
  if (activity.type.startsWith("inventory_list")) return <ClipboardList color={activityColors.blue} size={20} />;
  if (activity.type === "product_deleted") return <Trash2 color={activityColors.red} size={20} />;
  if (activity.type === "product_updated") return <Pencil color={colors.orange} size={20} />;
  return <Package color={activityColors.green} size={20} />;
}

function InventoryStatCard({ icon, label, value, width }: InventoryStatCardProps) {
  return (
    <AppCard className="border-primary bg-white" style={{ flexBasis: width, flexGrow: 1 }}>
      <View className="min-h-24 gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-md bg-primary">{icon}</View>
        <View className="gap-1">
          <Text numberOfLines={2} className="text-sm font-semibold text-secondary_dark">
            {label}
          </Text>
          <Text className="text-2xl font-bold text-secondary_dark">{formatCount(value)}</Text>
        </View>
      </View>
    </AppCard>
  );
}

function QuickActionCard({ description, icon, label, onPress, width }: QuickActionCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flexBasis: width, flexGrow: 1 }}>
      <AppCard className="items-center border-primary bg-white">
        <View className="min-h-32 items-center justify-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-md bg-primary">{icon}</View>
          <View className="items-center gap-1">
            <Text numberOfLines={2} className="text-center text-base font-bold text-secondary_dark">
              {label}
            </Text>
            <Text numberOfLines={2} className="text-center text-sm leading-5 text-muted">
              {description}
            </Text>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

function ActivityRow({ activity, isLast, t }: { activity: InventoryActivity; isLast: boolean; t: (key: string) => string }) {
  return (
    <View className={clsx("flex-row items-center gap-3 py-3", !isLast && "border-b border-primary")}>
      <View className="h-11 w-11 items-center justify-center rounded-md bg-primary">{getActivityIcon(activity)}</View>
      <View className="min-w-0 flex-1 gap-1">
        <Text numberOfLines={2} className="font-semibold text-secondary_dark">
          {getActivityTitle(activity, t)}
        </Text>
        <Text numberOfLines={1} className="text-sm text-muted">
          {getActivitySubtitle(activity, t)}
        </Text>
      </View>
      <Text className="text-right text-sm text-muted">{formatActivityTime(activity.createdAt, t)}</Text>
    </View>
  );
}

export function InventoryTab() {
  const { t } = useI18n();
  const responsive = useResponsiveLayout();
  const session = useAuthStore((state) => state.session);
  const { activities, hasLoadError, isLoading, stats } = useInventoryOverview();
  const isAdmin = session?.user.role === "admin";
  const userName = session?.user.name ?? t("inventoryUserFallback");
  const cardWidth: DimensionValue = responsive.isExtraSmallPhone ? "100%" : responsive.isPhone ? "47%" : responsive.isTablet ? "23%" : "47%";

  const quickActions = [
    {
      description: t("inventoryCreateListDescription"),
      icon: <ListPlus color={activityColors.blue} size={24} />,
      label: t("createInventoryList"),
      onPress: () => router.push(routes.newInventoryList),
    },
    {
      description: t("inventoryListsDescription"),
      icon: <ClipboardList color={activityColors.blue} size={24} />,
      label: t("inventoryLists"),
      onPress: () => router.push(routes.inventoryLists),
    },
    {
      description: isAdmin ? t("addProductDescription") : t("inventoryProductsDescription"),
      icon: <Package color={activityColors.blue} size={24} />,
      label: isAdmin ? t("addProduct") : t("products"),
      onPress: () => router.push(routes.products),
    },
    ...(isAdmin
      ? [
          {
            description: t("productSettingsDescription"),
            icon: <Settings color={activityColors.blue} size={24} />,
            label: t("productSettings"),
            onPress: () => router.push(routes.productSettings),
          },
        ]
      : []),
  ];

  return (
    <Screen tabPage headerActions={<TabHeaderActions />} icon={<ClipboardList color={colors.secondaryDark} size={36} />} title={t("inventoryWorkspace")} subtitle={t("inventoryWorkspaceSubtitle")}>
      <View className="gap-5">
        <RevealOnScroll>
          <View className="overflow-hidden rounded-lg border border-primary bg-white px-4 py-5" style={{ minHeight: responsive.isPhone ? 186 : 168 }}>
            <View className="gap-2" style={{ width: responsive.isPhone ? "64%" : "62%" }}>
              <Text className="text-sm font-medium text-muted">{replacePlaceholders(t("inventoryGreeting"), { name: userName })}</Text>
              <Text className="text-3xl font-bold text-secondary_dark">{t("inventoryManagementTitle")}</Text>
              <Text className="text-base leading-6 text-secondary_dark">{t("inventoryManagementSubtitle")}</Text>
            </View>
            <Image
              source={require("../../../../assets/inventory_heroimg.png")}
              resizeMode="contain"
              style={{
                height: responsive.isPhone ? 116 : 146,
                position: "absolute",
                right: responsive.isPhone ? -18 : 16,
                top: responsive.isPhone ? 34 : 14,
                width: responsive.isPhone ? 176 : 224,
              }}
            />
          </View>
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <View className="flex-row flex-wrap" style={{ gap: responsive.isPhone ? 12 : 14 }}>
            <InventoryStatCard icon={<ClipboardList color={activityColors.blue} size={21} />} label={t("activeLists")} value={isLoading ? 0 : stats.activeLists} width={cardWidth} />
            <InventoryStatCard icon={<AlertTriangle color={colors.orange} size={21} />} label={t("lowStockItems")} value={isLoading ? 0 : stats.lowStockItems} width={cardWidth} />
            <InventoryStatCard icon={<Package color={activityColors.green} size={21} />} label={t("totalProducts")} value={isLoading ? 0 : stats.totalProducts} width={cardWidth} />
            <InventoryStatCard icon={<Tags color={activityColors.purple} size={21} />} label={t("categories")} value={isLoading ? 0 : stats.categories} width={cardWidth} />
          </View>
        </RevealOnScroll>

        {hasLoadError ? <Text className="text-sm text-muted">{t("inventoryOverviewLoadFailed")}</Text> : null}

        <RevealOnScroll delay={140}>
          <View className="gap-3">
            <Text className="text-xl font-bold text-secondary_dark">{t("quickActions")}</Text>
            <View className="flex-row flex-wrap" style={{ gap: responsive.isPhone ? 12 : 14 }}>
              {quickActions.map((action) => (
                <QuickActionCard key={action.label} description={action.description} icon={action.icon} label={action.label} onPress={action.onPress} width={cardWidth} />
              ))}
            </View>
          </View>
        </RevealOnScroll>

        <RevealOnScroll delay={200}>
          <View className="gap-3">
            <Text className="text-xl font-bold text-secondary_dark">{t("recentInventoryActivity")}</Text>
            <AppCard className="border-primary bg-white py-1">
              {activities.length === 0 ? <Text className="py-3 text-sm leading-5 text-muted">{t("recentInventoryActivityEmpty")}</Text> : null}
              {activities.length > 0 ? (
                <>
                {activities.map((activity, index) => (
                  <ActivityRow key={activity.id} activity={activity} isLast={index === activities.length - 1} t={t} />
                ))}
                </>
              ) : null}
            </AppCard>
          </View>
        </RevealOnScroll>
      </View>
    </Screen>
  );
}
