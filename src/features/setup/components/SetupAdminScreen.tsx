import { router } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { SetupScreen } from "@/features/setup/components/SetupScreen";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { setupAdminSchema } from "@/features/setup/validation/setup.schemas";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/AppInput";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useI18n } from "@/shared/i18n/useI18n";

type AdminForm = {
  name: string;
  password: string;
};

const emptyForm: AdminForm = { name: "", password: "" };

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function SetupAdminScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const admins = useSetupStore((state) => state.draft.admins);
  const addAdmin = useSetupStore((state) => state.addAdmin);
  const removeAdmin = useSetupStore((state) => state.removeAdmin);
  const [form, setForm] = useState<AdminForm>(emptyForm);

  const updateField = (field: keyof AdminForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleAddAdmin = () => {
    const parsed = setupAdminSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(t("checkAdminDetails"), t("fullNamePasswordRequired"));
      return false;
    }
    if (admins.some((admin) => normalizeName(admin.name) === normalizeName(parsed.data.name))) {
      toast.error(t("adminAlreadyAdded"));
      return false;
    }
    addAdmin(parsed.data);
    setForm(emptyForm);
    toast.success(t("adminAdded"));
    return true;
  };

  const handleNext = () => {
    if (admins.length < 1) {
      toast.error(t("addAtLeastOneAdmin"));
      return;
    }
    router.push("/(setup)/instructions");
  };

  return (
    <SetupScreen
      step={t("step3")}
      stepNumber={3}
      title={t("adminsTitle")}
      subtitle={t("adminsSubtitle")}
      footer={
        <>
          <AppButton label={t("continue")} onPress={handleNext} className="bg-secondary_dark" />
          <AppButton label={t("back")} variant="secondary" onPress={() => router.back()} />
        </>
      }
    >
      <View className="gap-3 rounded-md border border-primary bg-white p-4">
        <AppInput label={t("fullName")} value={form.name} onChangeText={(value) => updateField("name", value)} autoCapitalize="words" />
        <AppInput label={t("password")} value={form.password} onChangeText={(value) => updateField("password", value.replace(/\D/g, ""))} keyboardType="number-pad" secureTextEntry />
        <AppButton label={t("addAdmin")} onPress={handleAddAdmin} className="bg-secondary" />
      </View>

      {admins.length ? (
        <View className="gap-2">
          <Text className="text-sm font-semibold text-secondary">{t("admins")}</Text>
          {admins.map((admin) => (
            <View key={admin.id} className="min-h-14 flex-row items-center justify-between gap-3 rounded-md border border-primary bg-white px-4">
              <View className="flex-1">
                <Text className="font-semibold text-secondary_dark">{admin.name}</Text>
                <Text className="text-sm text-muted">{t("adminAccess")}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => removeAdmin(admin.id)} className="h-10 w-10 items-center justify-center rounded-sm border border-primary">
                <Trash2 color={colors.secondary} size={18} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </SetupScreen>
  );
}
