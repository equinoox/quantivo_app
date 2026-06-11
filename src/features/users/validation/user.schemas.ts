import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "manager", "worker"]);
