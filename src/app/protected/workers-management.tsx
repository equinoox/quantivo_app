import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import clsx from "clsx";
import { Pencil, Trash2, UsersRound } from "lucide-react-native";

import { createWorker, deleteWorker, listWorkers, updateWorker } from "@/features/workers/services/workers.service";
import { CreateWorkerInput, UpdateWorkerInput, Worker, workerRoles, WorkerRole } from "@/features/workers/types/worker.types";
import { createWorkerSchema, updateWorkerSchema } from "@/features/workers/validation/worker.schemas";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppCard } from "@/shared/components/ui/AppCard";
import { AppError } from "@/shared/components/ui/AppError";
import { AppInput } from "@/shared/components/ui/AppInput";
import { AppModal } from "@/shared/components/ui/AppModal";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { LoadingState } from "@/shared/components/ui/LoadingState";
import { RevealOnScroll } from "@/shared/components/ui/RevealOnScroll";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useProtectedRoute } from "@/shared/hooks/useProtectedRoute";
import { useI18n } from "@/shared/i18n/useI18n";

type WorkerFormState = {
  age: string;
  fullName: string;
  password: string;
  role: WorkerRole;
  workerType: string;
};

const emptyForm: WorkerFormState = {
  age: "",
  fullName: "",
  password: "",
  role: "Worker",
  workerType: "",
};

function workerToForm(worker: Worker): WorkerFormState {
  return {
    age: worker.age.toString(),
    fullName: worker.fullName,
    password: "",
    role: worker.role,
    workerType: worker.workerType,
  };
}

export default function WorkersManagementScreen() {
  const { session, isHydrated } = useProtectedRoute({ allowedRoles: ["admin"] });
  const toast = useAppToast();
  const { t } = useI18n();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [form, setForm] = useState<WorkerFormState>(emptyForm);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = session?.user.role === "admin";
  const workerCountLabel = useMemo(() => t("workersCount").replace("{count}", workers.length.toString()), [t, workers.length]);

  const loadWorkers = async () => {
    try {
      setIsLoading(true);
      setWorkers(await listWorkers());
    } catch (error) {
      toast.error(t("databaseLoadFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated || !isAdmin) return;
    void loadWorkers();
  }, [isAdmin, isHydrated]);

  const openCreateForm = () => {
    setEditingWorker(null);
    setForm(emptyForm);
    setIsFormVisible(true);
  };

  const openEditForm = (worker: Worker) => {
    setEditingWorker(worker);
    setForm(workerToForm(worker));
    setIsFormVisible(true);
  };

  const closeForm = () => {
    setIsFormVisible(false);
    setEditingWorker(null);
    setForm(emptyForm);
  };

  const updateForm = (field: keyof WorkerFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateNumericForm = (field: "age" | "password", value: string) => {
    updateForm(field, value.replace(/\D/g, ""));
  };

  const handleSave = async () => {
    const parsed = editingWorker ? updateWorkerSchema.safeParse(form) : createWorkerSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(t("workerValidationError"));
      return;
    }

    const input: CreateWorkerInput | UpdateWorkerInput = {
      age: parsed.data.age,
      fullName: parsed.data.fullName,
      role: parsed.data.role,
      workerType: parsed.data.workerType,
      ...(parsed.data.password ? { password: parsed.data.password } : {}),
    };
    try {
      setIsSaving(true);
      if (editingWorker) await updateWorker(editingWorker.id, input);
      else await createWorker(input as CreateWorkerInput);
      toast.success(t("workerSaved"));
      closeForm();
      await loadWorkers();
    } catch (error) {
      toast.error(t("workerSaveFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWorker(deleteTarget.id);
      setWorkers((current) => current.filter((worker) => worker.id !== deleteTarget.id));
      toast.success(t("workerDeleted"));
      setDeleteTarget(null);
    } catch (error) {
      toast.error(t("workerDeleteFailed"), error instanceof Error ? error.message : undefined);
    }
  };

  if (!isHydrated) {
    return (
      <Screen icon={<UsersRound color={colors.secondaryDark} size={36} />} title={t("workersManagement")} subtitle={t("workersManagementSubtitle")} showBackButton>
        <LoadingState label={t("loadingWorkers")} />
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen title={t("unauthorized")} subtitle={t("unauthorizedMessage")} showBackButton>
        <AppError title={t("unauthorized")} message={t("unauthorizedMessage")} />
      </Screen>
    );
  }

  return (
    <Screen icon={<UsersRound color={colors.secondaryDark} size={36} />} title={t("workersManagement")} subtitle={t("workersManagementSubtitle")} showBackButton>
      <View className="gap-4">
        <RevealOnScroll>
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-sm font-semibold text-secondary">{workerCountLabel}</Text>
            <AppButton label={t("createWorker")} onPress={openCreateForm} className="bg-secondary_dark" />
          </View>
        </RevealOnScroll>

        {isLoading ? <LoadingState label={t("loadingWorkers")} /> : null}

        {!isLoading && workers.length === 0 ? (
          <RevealOnScroll>
            <AppCard>
              <EmptyState title={t("workersEmptyTitle")} message={t("workersEmptyMessage")} />
            </AppCard>
          </RevealOnScroll>
        ) : null}

        {!isLoading && workers.length > 0 ? (
          <View className="gap-3">
            {workers.map((worker) => (
              <RevealOnScroll key={worker.id} duration={560}>
                <AppCard className="border-primary">
                  <View className="gap-3">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-secondary_dark">{worker.fullName}</Text>
                        <Text className="mt-1 text-sm text-muted">{worker.workerType || "-"}</Text>
                      </View>
                      <View className="rounded-md bg-primary px-3 py-1">
                        <Text className="text-xs font-semibold text-secondary_dark">{worker.role}</Text>
                      </View>
                    </View>
                    <View className="flex-row gap-3">
                      <Text className="text-sm text-secondary">{t("age")}: {worker.age}</Text>
                      <Text className="text-sm text-secondary">{t("workerType")}: {worker.workerType || "-"}</Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable onPress={() => openEditForm(worker)} className="min-h-10 flex-1 flex-row items-center justify-center gap-2 rounded-md border border-primary bg-white px-3">
                        <Pencil color={colors.secondaryDark} size={16} />
                        <Text className="font-semibold text-secondary_dark">{t("edit")}</Text>
                      </Pressable>
                      <Pressable onPress={() => setDeleteTarget(worker)} className="min-h-10 flex-1 flex-row items-center justify-center gap-2 rounded-md bg-red-600 px-3">
                        <Trash2 color="#ffffff" size={16} />
                        <Text className="font-semibold text-white">{t("delete")}</Text>
                      </Pressable>
                    </View>
                  </View>
                </AppCard>
              </RevealOnScroll>
            ))}
          </View>
        ) : null}
      </View>

      <AppModal visible={isFormVisible} onClose={closeForm}>
        <View className="max-h-[88%] gap-5">
          <View>
            <Text className="text-xl font-semibold text-secondary_dark">{editingWorker ? t("updateWorker") : t("createWorker")}</Text>
            <Text className="mt-1 text-sm text-muted">{t("workersManagementSubtitle")}</Text>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <View className="gap-4">
              <AppInput label={t("fullName")} value={form.fullName} onChangeText={(value) => updateForm("fullName", value)} autoCapitalize="words" />
              <AppInput label={t("age")} value={form.age} onChangeText={(value) => updateNumericForm("age", value)} keyboardType="number-pad" />
              <View className="gap-1">
                <AppInput label={t("password")} value={form.password} onChangeText={(value) => updateNumericForm("password", value)} keyboardType="number-pad" secureTextEntry />
                <Text className="text-xs text-muted">{editingWorker ? t("workerPasswordUpdateHint") : t("workerPasswordCreateHint")}</Text>
              </View>
              <View className="gap-2">
                <Text className="text-sm font-medium text-ink">{t("role")}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {workerRoles.map((role) => (
                    <Pressable key={role} onPress={() => setForm((current) => ({ ...current, role }))} className={clsx("min-h-10 justify-center rounded-md border px-3", form.role === role ? "border-orange bg-primary" : "border-primary bg-white")}>
                      <Text className="font-semibold text-secondary_dark">{role}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <AppInput label={t("workerType")} value={form.workerType} onChangeText={(value) => updateForm("workerType", value)} placeholder={t("workerTypePlaceholder")} />
            </View>
          </ScrollView>

          <View className="gap-3">
            <AppButton label={editingWorker ? t("updateWorker") : t("createWorker")} loading={isSaving} onPress={handleSave} className="bg-secondary_dark" />
            <AppButton label={t("cancel")} variant="secondary" onPress={closeForm} />
          </View>
        </View>
      </AppModal>

      <ConfirmDialog destructive visible={Boolean(deleteTarget)} title={t("deleteWorkerTitle")} message={t("deleteWorkerMessage")} cancelLabel={t("cancel")} confirmLabel={t("delete")} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </Screen>
  );
}
