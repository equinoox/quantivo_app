import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Check, ChevronDown, ChevronRight, CircleUserRound, Database, ImageIcon, LogOut, Settings, Trash2, UsersRound, Wrench } from "lucide-react-native";
import { ReactNode, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import clsx from "clsx";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { SESSION_TIMEOUT_OPTIONS, type SessionTimeoutMinutes } from "@/features/auth/services/session.service";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { AppCurrency, AppDateFormat, AppLanguage, AppTimeFormat } from "@/features/setup/types/setup.types";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/AppInput";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { roleLabels } from "@/shared/constants/roles";
import { routes } from "@/shared/constants/routes";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useI18n } from "@/shared/i18n/useI18n";

const timezoneOptions = [
  { label: "UTC+0 UTC", value: "UTC" },
  { label: "UTC+1 Europe/Belgrade", value: "Europe/Belgrade" },
  { label: "UTC+2 Europe/Athens", value: "Europe/Athens" },
  { label: "UTC-5 America/New_York", value: "America/New_York" },
];

const dateFormats: AppDateFormat[] = ["dd/MM/yyyy", "dd.MM.yyyy", "MM/dd/yyyy", "yyyy-MM-dd"];
const timeFormats: AppTimeFormat[] = ["24h", "12h"];
const currencies: AppCurrency[] = ["RSD", "EUR", "USD"];

function OptionChip({ isSelected, label, onPress }: { isSelected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("min-h-10 flex-row items-center gap-2 rounded-md border bg-white px-3", isSelected ? "border-orange" : "border-primary")}>
      {isSelected ? <Check color={colors.orange} size={15} /> : null}
      <Text className="font-semibold text-secondary_dark">{label}</Text>
    </Pressable>
  );
}

function SectionDivider() {
  return <View className="my-2 h-px bg-primary" />;
}

function SettingsRow({ description, destructive = false, icon, isExpanded = false, label, onPress, showChevron = true }: { description?: string; destructive?: boolean; icon: ReactNode; isExpanded?: boolean; label: string; onPress: () => void; showChevron?: boolean }) {
  return (
    <Pressable onPress={onPress} className="min-h-14 flex-row items-center gap-3 rounded-md px-3 py-2 active:bg-primary">
      <View className={clsx("h-10 w-10 items-center justify-center rounded-md", destructive ? "bg-red-50" : "bg-primary")}>{icon}</View>
      <View className="flex-1">
        <Text className={clsx("text-base font-semibold", destructive ? "text-red-700" : "text-secondary_dark")}>{label}</Text>
        {description ? <Text className="text-sm leading-5 text-muted">{description}</Text> : null}
      </View>
      {showChevron ? isExpanded ? <ChevronDown color={destructive ? "#b91c1c" : colors.secondaryDark} size={20} /> : <ChevronRight color={destructive ? "#b91c1c" : colors.secondaryDark} size={20} /> : null}
    </Pressable>
  );
}

export function SettingsTab() {
  const toast = useAppToast();
  const { t } = useI18n();
  const clearSession = useAuthStore((state) => state.clearSession);
  const refreshSessionActivity = useAuthStore((state) => state.refreshSessionActivity);
  const session = useAuthStore((state) => state.session);
  const draft = useSetupStore((state) => state.draft);
  const setLanguage = useSetupStore((state) => state.setLanguage);
  const setTimezone = useSetupStore((state) => state.setTimezone);
  const setDateFormat = useSetupStore((state) => state.setDateFormat);
  const setTimeFormat = useSetupStore((state) => state.setTimeFormat);
  const setSessionTimeoutMinutes = useSetupStore((state) => state.setSessionTimeoutMinutes);
  const setRestaurantName = useSetupStore((state) => state.setRestaurantName);
  const setBusinessLogoUri = useSetupStore((state) => state.setBusinessLogoUri);
  const setBusinessBackgroundUri = useSetupStore((state) => state.setBusinessBackgroundUri);
  const setCurrency = useSetupStore((state) => state.setCurrency);
  const saveSettings = useSetupStore((state) => state.saveSettings);
  const resetSetup = useSetupStore((state) => state.resetSetup);
  const [isResetConfirmVisible, setIsResetConfirmVisible] = useState(false);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [isWorkspaceSetupExpanded, setIsWorkspaceSetupExpanded] = useState(false);

  const handleLogout = async () => {
    await clearSession();
    router.replace("/(auth)/login");
  };

  const handleResetSetup = async () => {
    setIsResetConfirmVisible(false);
    await clearSession();
    const result = await resetSetup();
    if (!result.ok) {
      toast.error(t("resetSetupFailed"), result.error);
      return;
    }
    toast.success(t("resetSetupDone"));
    router.replace("/(setup)/language");
  };

  const handlePickBusinessImage = async (target: "logo" | "background") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error(t("imagePermissionRequired"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: target === "logo" ? [1, 1] : [9, 16],
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled) return;
    const uri = result.assets[0]?.uri ?? "";
    if (target === "logo") setBusinessLogoUri(uri);
    else setBusinessBackgroundUri(uri);
  };

  const handleSaveWorkspaceSettings = async () => {
    if (session?.user.role !== "admin") return;
    if (!draft.restaurantName.trim()) {
      toast.error(t("restaurantNameError"));
      return;
    }

    try {
      setIsSavingWorkspace(true);
      const result = await saveSettings();
      if (!result.ok) {
        toast.error(t("workspaceSettingsSaveFailed"), result.error);
        return;
      }
      await refreshSessionActivity(result.data.sessionTimeoutMinutes);
      toast.success(t("workspaceSettingsSaved"));
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const languages: { value: AppLanguage; label: string }[] = [
    { value: "en", label: `${t("english")} \u{1F1EC}\u{1F1E7}` },
    { value: "sr", label: `${t("serbian")} \u{1F1F7}\u{1F1F8}` },
  ];
  const sessionTimeoutOptions: { value: SessionTimeoutMinutes | null; label: string }[] = [
    { value: null, label: t("sessionExpirationDisabled") },
    ...SESSION_TIMEOUT_OPTIONS.map((value) => ({ value, label: value === 60 ? t("sessionExpiration1Hour") : t(`sessionExpiration${value}Minutes`) })),
  ];

  return (
    <Screen icon={<Settings color={colors.secondaryDark} size={36} />} title={t("settings")} subtitle={t("settingsFoundation")} showBackButton>
      <View className="gap-2 rounded-md border border-primary bg-white p-2">
        <View className="min-h-16 flex-row items-center gap-3 rounded-md bg-primary px-3 py-3">
          <View className="h-11 w-11 items-center justify-center rounded-md bg-white">
            <CircleUserRound color={colors.secondaryDark} size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-secondary_dark">{session?.user.name ?? t("fullName")}</Text>
            <Text className="text-sm font-medium text-secondary">{session?.user.role ? roleLabels[session.user.role] : ""}</Text>
          </View>
        </View>

        {session?.user.role === "admin" ? (
          <>
            <SectionDivider />
            <SettingsRow icon={<UsersRound color={colors.secondaryDark} size={20} />} label={t("manageWorkers")} onPress={() => router.push(routes.workersManagement)} />
            <SettingsRow description={t("workspaceSetupDescription")} icon={<Wrench color={colors.secondaryDark} size={20} />} isExpanded={isWorkspaceSetupExpanded} label={t("workspaceSetup")} onPress={() => setIsWorkspaceSetupExpanded((current) => !current)} />
            {isWorkspaceSetupExpanded ? (
              <View className="gap-4 rounded-md border border-primary bg-background p-3">
                <View className="gap-1">
                  <Text className="text-lg font-semibold text-secondary_dark">{t("workspaceSetup")}</Text>
                  <Text className="text-sm text-muted">{t("workspaceSetupDescription")}</Text>
                </View>

                <View className="gap-3">
                  <Text className="text-sm font-semibold text-secondary_dark">{t("chooseLanguageTitle")}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {languages.map((item) => <OptionChip key={item.value} isSelected={draft.language === item.value} label={item.label} onPress={() => setLanguage(item.value)} />)}
                  </View>
                </View>

                <View className="gap-3">
                  <Text className="text-sm font-semibold text-secondary_dark">{t("timezone")}</Text>
                  <View className="gap-2">
                    {timezoneOptions.map((item) => <OptionChip key={item.value} isSelected={draft.timezone === item.value} label={item.label} onPress={() => setTimezone(item.value)} />)}
                  </View>
                </View>

                <View className="gap-3">
                  <Text className="text-sm font-semibold text-secondary_dark">{t("dateFormat")}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {dateFormats.map((item) => <OptionChip key={item} isSelected={draft.dateFormat === item} label={item} onPress={() => setDateFormat(item)} />)}
                  </View>
                </View>

                <View className="gap-3">
                  <Text className="text-sm font-semibold text-secondary_dark">{t("timeFormat")}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {timeFormats.map((item) => <OptionChip key={item} isSelected={draft.timeFormat === item} label={item === "12h" ? t("timeFormat12h") : t("timeFormat24h")} onPress={() => setTimeFormat(item)} />)}
                  </View>
                </View>

                <View className="gap-3">
                  <View className="gap-1">
                    <Text className="text-sm font-semibold text-secondary_dark">{t("sessionExpiration")}</Text>
                    <Text className="text-sm leading-5 text-muted">{t("sessionExpirationDescription")}</Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {sessionTimeoutOptions.map((item) => <OptionChip key={item.value ?? "disabled"} isSelected={draft.sessionTimeoutMinutes === item.value} label={item.label} onPress={() => setSessionTimeoutMinutes(item.value)} />)}
                  </View>
                </View>

                <AppInput label={t("restaurantName")} value={draft.restaurantName} onChangeText={setRestaurantName} autoCapitalize="words" />

                <View className="gap-3">
                  <Text className="text-sm font-semibold text-secondary_dark">{t("currency")}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {currencies.map((item) => <OptionChip key={item} isSelected={draft.currency === item} label={item} onPress={() => setCurrency(item)} />)}
                  </View>
                </View>

                <View className="gap-2">
                  <Text className="text-sm font-semibold text-secondary_dark">{t("businessLogo")}</Text>
                  <Text className="text-sm leading-5 text-muted">{t("businessLogoGuidance")}</Text>
                  <View className="flex-row items-center gap-3">
                    <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-primary bg-white">
                      {draft.businessLogoUri ? <Image source={{ uri: draft.businessLogoUri }} className="h-full w-full" resizeMode="cover" /> : <ImageIcon color={colors.secondaryDark} size={28} />}
                    </View>
                    <View className="flex-1 gap-2">
                      <AppButton label={t("selectLogo")} variant="secondary" onPress={() => handlePickBusinessImage("logo")} />
                      {draft.businessLogoUri ? <AppButton label={t("removeLogo")} variant="danger" onPress={() => setBusinessLogoUri("")} /> : null}
                    </View>
                  </View>
                </View>

                <View className="gap-2">
                  <Text className="text-sm font-semibold text-secondary_dark">{t("businessBackground")}</Text>
                  <Text className="text-sm leading-5 text-muted">{t("businessBackgroundGuidance")}</Text>
                  <View className="flex-row items-center gap-3">
                    <View className="h-28 w-20 items-center justify-center overflow-hidden rounded-md border border-primary bg-white">
                      {draft.businessBackgroundUri ? <Image source={{ uri: draft.businessBackgroundUri }} className="h-full w-full" resizeMode="cover" /> : <ImageIcon color={colors.secondaryDark} size={28} />}
                    </View>
                    <View className="flex-1 gap-2">
                      <AppButton label={t("selectBackground")} variant="secondary" onPress={() => handlePickBusinessImage("background")} />
                      {draft.businessBackgroundUri ? <AppButton label={t("removeBackground")} variant="danger" onPress={() => setBusinessBackgroundUri("")} /> : null}
                    </View>
                  </View>
                </View>

                <AppButton label={t("saveWorkspaceSettings")} loading={isSavingWorkspace} onPress={handleSaveWorkspaceSettings} className="bg-secondary_dark" />
              </View>
            ) : null}
            {__DEV__ ? <SettingsRow icon={<Database color={colors.secondaryDark} size={20} />} label={t("developerDatabase")} onPress={() => router.push(routes.devDatabase)} /> : null}
            <SettingsRow destructive icon={<Trash2 color="#b91c1c" size={20} />} label={t("resetSetup")} onPress={() => setIsResetConfirmVisible(true)} />
          </>
        ) : null}

        <SectionDivider />
        <SettingsRow icon={<LogOut color={colors.secondaryDark} size={20} />} label={t("logout")} onPress={handleLogout} showChevron={false} />
      </View>

      <ConfirmDialog destructive visible={isResetConfirmVisible} title={t("resetSetupTitle")} message={t("resetSetupMessage")} cancelLabel={t("cancel")} confirmLabel={t("confirm")} onCancel={() => setIsResetConfirmVisible(false)} onConfirm={handleResetSetup} />
    </Screen>
  );
}
