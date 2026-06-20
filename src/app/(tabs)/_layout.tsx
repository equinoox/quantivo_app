import { Redirect, Tabs } from "expo-router";
import { BarChart3, CircleDollarSign, ClipboardList, FileText, LayoutDashboard } from "lucide-react-native";

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
      <Tabs.Screen name="dashboard" options={{ title: t("dashboardMain"), tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
      <Tabs.Screen name="inventory" options={{ title: t("inventory"), tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }} />
      <Tabs.Screen name="finance" options={{ title: t("finances"), tabBarIcon: ({ color, size }) => <CircleDollarSign color={color} size={size} /> }} />
      <Tabs.Screen name="invoices" options={{ title: t("invoices"), tabBarIcon: ({ color, size }) => <FileText color={color} size={size} /> }} />
      <Tabs.Screen name="reports" options={{ title: t("reports"), tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }} />
    </Tabs>
  );
}
