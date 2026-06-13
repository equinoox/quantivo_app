export type WorkerRole = "Admin" | "Manager" | "Worker";

export type Worker = {
  id: string;
  userId?: string | null;
  fullName: string;
  age: number;
  role: WorkerRole;
  workerType: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkerBaseInput = {
  fullName: string;
  age: number;
  role: WorkerRole;
  workerType: string;
};

export type CreateWorkerInput = WorkerBaseInput & { password: string };
export type UpdateWorkerInput = WorkerBaseInput & { password?: string };

export const workerRoles: WorkerRole[] = ["Admin", "Manager", "Worker"];
