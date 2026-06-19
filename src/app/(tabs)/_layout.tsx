import { Redirect, Tabs } from "expo-router";
import { CircleDollarSign, ClipboardList, ListPlus, Package, Settings } from "lucide-react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { colors } from "@/shared/constants/colors";
import { useI18n } from "@/shared/i18n/useI18n";

export default function TabsLayout() {
  const session = useAuthStore((state) => state.session);
  const setupStatus = useSetupStore((state) => state.status);
  const { t } = useI18n();

  if (!setupStatus?.isComplete) return <Redirect href="/(setup)/language" />;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.textColor2,
        tabBarLabelStyle: { fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: colors.secondaryDark,
          marginBottom: 6,
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t("dashboard"), tabBarIcon: ({ color, size }) => <ListPlus color={color} size={size} /> }} />
      <Tabs.Screen name="inventory" options={{ title: t("inventory"), tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }} />
      <Tabs.Screen name="products" options={{ title: t("products"), tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }} />
      <Tabs.Screen name="reports" options={{ title: t("finances"), tabBarIcon: ({ color, size }) => <CircleDollarSign color={color} size={size} /> }} />
      <Tabs.Screen name="settings" options={{ title: t("settings"), tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
    </Tabs>
  );
}
