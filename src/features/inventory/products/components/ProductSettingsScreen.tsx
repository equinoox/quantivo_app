import { router } from "expo-router";
import { FolderTree, Ruler, Tags } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { AppCard } from "@/shared/components/ui/AppCard";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { routes } from "@/shared/constants/routes";
import { useI18n } from "@/shared/i18n/useI18n";

type ProductSettingsOptionProps = {
  description: string;
  icon: ReactNode;
  label: string;
  onPress: () => void;
};

function ProductSettingsOption({ description, icon, label, onPress }: ProductSettingsOptionProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <AppCard className="border-primary bg-white">
        <View className="min-h-20 flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-md bg-primary">{icon}</View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-semibold text-secondary_dark">{label}</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">{description}</Text>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

export function ProductSettingsScreen() {
  const { t } = useI18n();

  return (
    <Screen icon={<Tags color={colors.secondaryDark} size={36} />} title={t("productSettings")} subtitle={t("productSettingsChooserSubtitle")} showBackButton>
      <View className="gap-3">
        <RevealOnScroll>
          <ProductSettingsOption description={t("inventoryCategoriesDescription")} icon={<FolderTree color={colors.secondaryDark} size={22} />} label={t("categories")} onPress={() => router.push(routes.categories)} />
        </RevealOnScroll>
        <RevealOnScroll delay={80}>
          <ProductSettingsOption description={t("inventoryUnitsAttributesDescription")} icon={<Ruler color={colors.secondaryDark} size={22} />} label={t("units")} onPress={() => router.push(routes.units)} />
        </RevealOnScroll>
        <RevealOnScroll delay={140}>
          <ProductSettingsOption description={t("inventoryAttributesDescription")} icon={<Tags color={colors.secondaryDark} size={22} />} label={t("attributes")} onPress={() => router.push(routes.attributes)} />
        </RevealOnScroll>
      </View>
    </Screen>
  );
}
