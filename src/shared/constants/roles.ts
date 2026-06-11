export const roles = ["admin", "manager", "worker"] as const;
export type UserRole = (typeof roles)[number];
export const roleLabels: Record<UserRole, string> = { admin: "Admin", manager: "Manager", worker: "Worker" };
