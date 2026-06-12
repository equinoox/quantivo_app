import { Redirect, Tabs } from "expo-router";
import { BarChart3, Boxes, LayoutDashboard, Package, Settings } from "lucide-react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { colors } from "@/shared/constants/colors";

export default function TabsLayout() {
  const session = useAuthStore((state) => state.session);
  const setupStatus = useSetupStore((state) => state.status);

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
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard", tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
      <Tabs.Screen name="inventory" options={{ title: "Inventory", tabBarIcon: ({ color, size }) => <Boxes color={color} size={size} /> }} />
      <Tabs.Screen name="products" options={{ title: "Products", tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }} />
      <Tabs.Screen name="reports" options={{ title: "Reports", tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
    </Tabs>
  );
}
