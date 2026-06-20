import { desc, eq, isNull } from "drizzle-orm";

import { createLoginKeyForFullName, hashPasswordForLocalDemo } from "@/features/auth/services/local-auth.service";
import { CreateWorkerInput, UpdateWorkerInput, Worker, WorkerRole } from "@/features/team/types/worker.types";
import { UserRole } from "@/shared/constants/roles";
import { db } from "@/shared/lib/db/client";
import { users, workers } from "@/shared/lib/db/schema";
import { createLocalId } from "@/shared/lib/id/createLocalId";

const authRoleByWorkerRole: Record<WorkerRole, UserRole> = {
  Admin: "admin",
  Manager: "manager",
  Worker: "worker",
};

function toWorker(row: typeof workers.$inferSelect): Worker {
  return {
    age: row.age,
    createdAt: row.createdAt,
    fullName: row.fullName,
    id: row.id,
    role: row.role,
    userId: row.userId,
    updatedAt: row.updatedAt,
    workerType: row.workerType,
  };
}

async function assertLoginKeyAvailable(loginKey: string, currentUserId?: string | null): Promise<void> {
  const [existingUser] = await db.select().from(users).where(eq(users.loginKey, loginKey)).limit(1);
  if (existingUser && !existingUser.deletedAt && existingUser.id !== currentUserId) {
    throw new Error("A user with this full name already exists.");
  }
}

async function createOrRestoreAuthUser(input: CreateWorkerInput, now: string): Promise<string> {
  const loginKey = createLoginKeyForFullName(input.fullName);
  const [existingUser] = await db.select().from(users).where(eq(users.loginKey, loginKey)).limit(1);
  const passwordHash = await hashPasswordForLocalDemo(input.password);

  if (existingUser && !existingUser.deletedAt) throw new Error("A user with this full name already exists.");

  if (existingUser?.deletedAt) {
    await db
      .update(users)
      .set({
        deletedAt: null,
        loginKey,
        name: input.fullName.trim(),
        passwordHash,
        role: authRoleByWorkerRole[input.role],
        updatedAt: now,
      })
      .where(eq(users.id, existingUser.id));
    return existingUser.id;
  }

  const userId = createLocalId("usr");
  await db.insert(users).values({
    createdAt: now,
    id: userId,
    loginKey,
    name: input.fullName.trim(),
    passwordHash,
    role: authRoleByWorkerRole[input.role],
    updatedAt: now,
  });

  return userId;
}

export async function listWorkers(): Promise<Worker[]> {
  const rows = await db.select().from(workers).where(isNull(workers.deletedAt)).orderBy(desc(workers.createdAt));
  return rows.map(toWorker);
}

export async function createWorker(input: CreateWorkerInput): Promise<Worker> {
  const now = new Date().toISOString();
  const id = createLocalId("wrk");
  const userId = await createOrRestoreAuthUser(input, now);

  await db.insert(workers).values({
    age: input.age,
    createdAt: now,
    fullName: input.fullName.trim(),
    id,
    role: input.role,
    userId,
    updatedAt: now,
    workerType: input.workerType.trim(),
  });

  const [worker] = await db.select().from(workers).where(eq(workers.id, id)).limit(1);
  return toWorker(worker);
}

export async function updateWorker(id: string, input: UpdateWorkerInput): Promise<Worker> {
  const now = new Date().toISOString();
  const [currentWorker] = await db.select().from(workers).where(eq(workers.id, id)).limit(1);
  if (!currentWorker || currentWorker.deletedAt) throw new Error("Worker not found.");

  const loginKey = createLoginKeyForFullName(input.fullName);
  let userId = currentWorker.userId;

  if (userId) {
    await assertLoginKeyAvailable(loginKey, userId);
    const passwordHash = input.password ? await hashPasswordForLocalDemo(input.password) : undefined;
    await db
      .update(users)
      .set({
        loginKey,
        name: input.fullName.trim(),
        ...(passwordHash ? { passwordHash } : {}),
        role: authRoleByWorkerRole[input.role],
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  } else if (input.password) {
    userId = await createOrRestoreAuthUser({ ...input, password: input.password }, now);
  }

  await db
    .update(workers)
    .set({
      age: input.age,
      fullName: input.fullName.trim(),
      role: input.role,
      updatedAt: now,
      userId,
      workerType: input.workerType.trim(),
    })
    .where(eq(workers.id, id));

  const [worker] = await db.select().from(workers).where(eq(workers.id, id)).limit(1);
  return toWorker(worker);
}

export async function deleteWorker(id: string): Promise<void> {
  const now = new Date().toISOString();
  const [worker] = await db.select().from(workers).where(eq(workers.id, id)).limit(1);
  await db.update(workers).set({ deletedAt: now, updatedAt: now }).where(eq(workers.id, id));
  if (worker?.userId) await db.update(users).set({ deletedAt: now, updatedAt: now }).where(eq(users.id, worker.userId));
}
