import { router } from "expo-router";
import { ChevronRight, Database } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { listDatabaseTables, listTableRows } from "@/features/dev-db/services/dev-db.service";
import { DevDbRow, DevDbTable } from "@/features/dev-db/types/dev-db.types";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppCard } from "@/shared/components/ui/AppCard";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useProtectedRoute } from "@/shared/hooks/useProtectedRoute";
import { useI18n } from "@/shared/i18n/useI18n";

export default function DevDatabaseScreen() {
  useProtectedRoute({ allowedRoles: ["admin"] });
  const toast = useAppToast();
  const { t } = useI18n();
  const [tables, setTables] = useState<DevDbTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<DevDbRow[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [isLoadingRows, setIsLoadingRows] = useState(false);

  useEffect(() => {
    async function loadTables() {
      try {
        setIsLoadingTables(true);
        setTables(await listDatabaseTables());
      } catch (error) {
        toast.error(t("databaseLoadFailed"), error instanceof Error ? error.message : undefined);
      } finally {
        setIsLoadingTables(false);
      }
    }

    void loadTables();
  }, []);

  const handleSelectTable = async (tableName: string) => {
    try {
      setSelectedTable(tableName);
      setIsLoadingRows(true);
      setRows(await listTableRows(tableName));
    } catch (error) {
      toast.error(t("databaseLoadFailed"), error instanceof Error ? error.message : undefined);
    } finally {
      setIsLoadingRows(false);
    }
  };

  return (
    <Screen icon={<Database color={colors.secondaryDark} size={36} />} title={t("developerDatabase")} subtitle={t("databasePreviewLimit")} showBackButton>
      {!__DEV__ ? (
        <AppCard>
          <Text className="text-base text-secondary">{t("developerDatabaseUnavailable")}</Text>
          <AppButton label={t("back")} variant="secondary" onPress={() => router.back()} />
        </AppCard>
      ) : (
        <View className="gap-4">
          <Text className="text-lg font-semibold text-secondary_dark">{t("databaseTables")}</Text>

          {isLoadingTables ? <ActivityIndicator color={colors.orange} /> : null}

          <View className="gap-2">
            {tables.map((table) => (
              <Pressable key={table.name} onPress={() => handleSelectTable(table.name)} className="min-h-12 flex-row items-center justify-between rounded-md border border-primary bg-white px-4">
                <Text className="font-semibold text-secondary_dark">{table.name}</Text>
                <ChevronRight color={colors.secondary} size={18} />
              </Pressable>
            ))}
          </View>

          {selectedTable ? (
            <AppCard className="border-primary">
              <Text className="text-lg font-semibold text-secondary_dark">{selectedTable}</Text>
              {isLoadingRows ? <ActivityIndicator color={colors.orange} /> : null}
              {!isLoadingRows && rows.length === 0 ? <Text className="text-muted">{t("databaseNoRows")}</Text> : null}
              {!isLoadingRows && rows.length > 0 ? (
                <ScrollView horizontal>
                  <View className="gap-2">
                    {rows.map((row, index) => (
                      <View key={`${selectedTable}-${index}`} className="rounded-md border border-primary bg-background p-3">
                        <Text className="text-xs font-semibold uppercase text-orange">{t("databaseRow")} {index + 1}</Text>
                        <Text className="mt-1 font-mono text-xs leading-5 text-secondary">{JSON.stringify(row, null, 2)}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              ) : null}
            </AppCard>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
