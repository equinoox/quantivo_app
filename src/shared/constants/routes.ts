export const routes = {
  login: "/(auth)/login",
  dashboard: "/(tabs)/dashboard",
  inventory: "/(tabs)/inventory",
  products: "/(tabs)/products",
  reports: "/(tabs)/reports",
  settings: "/(tabs)/settings",
  devDatabase: "/protected/dev-database",
  unauthorized: "/protected/unauthorized",
} as const;
