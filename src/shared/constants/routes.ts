export const routes = {
  login: "/(auth)/login",
  register: "/(auth)/register",
  dashboard: "/(tabs)/dashboard",
  inventory: "/(tabs)/inventory",
  products: "/(tabs)/products",
  reports: "/(tabs)/reports",
  settings: "/(tabs)/settings",
  unauthorized: "/protected/unauthorized",
} as const;
