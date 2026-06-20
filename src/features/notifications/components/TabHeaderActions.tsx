import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Bell, Settings } from "lucide-react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { listInventoryNotifications } from "@/features/notifications/services/notifications.service";
import { InventoryNotification } from "@/features/notifications/types/notification.types";
import { useAppFormatters } from "@/features/setup/hooks/useAppFormatters";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppModal } from "@/shared/components/ui/AppModal";
import { colors } from "@/shared/constants/colors";
import { routes } from "@/shared/constants/routes";
import { useResponsiveLayout } from "@/shared/hooks/useResponsiveLayout";
import { useI18n } from "@/shared/i18n/useI18n";

const notificationsPageSize = 20;

function formatNotification(notification: InventoryNotification, t: (key: string) => string, formatDateTime: (value: string) => string): string {
  if (notification.type === "shift_finished") {
    const shift = notification.shift === "first" ? t("firstShift") : t("secondShift");
    return `${notification.actorNameSnapshot} ${t("finishedShiftCount")} ${notification.inventoryDate ?? ""} | ${shift} | ${formatDateTime(notification.createdAt)}`;
  }

  return `${notification.actorNameSnapshot} | ${notification.productNameSnapshot ?? ""} | ${notification.columnLabelSnapshot ?? ""} | ${notification.oldValue ?? 0} -> ${notification.newValue ?? 0} | ${formatDateTime(notification.createdAt)}`;
}

export function TabHeaderActions() {
  const { t } = useI18n();
  const session = useAuthStore((state) => state.session);
  const responsive = useResponsiveLayout();
  const { formatDateTime } = useAppFormatters();
  const canSeeNotifications = session?.user.role === "admin";
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isAllVisible, setIsAllVisible] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<InventoryNotification[]>([]);
  const [allNotifications, setAllNotifications] = useState<InventoryNotification[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState({ right: 20, top: 88 });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const bellRef = useRef<View>(null);

  const loadRecentNotifications = async () => {
    setRecentNotifications(await listInventoryNotifications({ limit: 3, offset: 0 }));
  };

  const toggleNotifications = async () => {
    if (!canSeeNotifications) return;
    const nextVisible = !isDropdownVisible;
    if (nextVisible) {
      bellRef.current?.measureInWindow((x, y, width, height) => {
        setDropdownPosition({
          right: Math.max(12, responsive.window.width - x - width),
          top: y + height + 8,
        });
      });
    }
    setIsDropdownVisible(nextVisible);
    if (nextVisible) await loadRecentNotifications();
  };

  const openAllNotifications = async () => {
    setIsDropdownVisible(false);
    setIsAllVisible(true);
    const rows = await listInventoryNotifications({ limit: notificationsPageSize, offset: 0 });
    setAllNotifications(rows);
    setHasMoreNotifications(rows.length === notificationsPageSize);
  };

  const loadMoreNotifications = async () => {
    if (isLoadingMore || !hasMoreNotifications) return;
    setIsLoadingMore(true);
    const rows = await listInventoryNotifications({ limit: notificationsPageSize, offset: allNotifications.length });
    setAllNotifications((current) => [...current, ...rows]);
    setHasMoreNotifications(rows.length === notificationsPageSize);
    setIsLoadingMore(false);
  };

  return (
    <>
      {canSeeNotifications ? (
        <Pressable ref={bellRef} accessibilityRole="button" onPress={toggleNotifications} className="h-10 w-10 items-center justify-center rounded-md bg-primary">
          <Bell color={colors.secondaryDark} size={20} />
        </Pressable>
      ) : null}
      <Pressable accessibilityRole="button" accessibilityLabel={t("settings")} onPress={() => router.push(routes.settings)} className="h-10 w-10 items-center justify-center rounded-md bg-primary">
        <Settings color={colors.secondaryDark} size={20} />
      </Pressable>

      <Modal transparent visible={canSeeNotifications && isDropdownVisible} animationType="fade" onRequestClose={() => setIsDropdownVisible(false)}>
        <Pressable className="flex-1 bg-transparent" onPress={() => setIsDropdownVisible(false)}>
          <View
            onStartShouldSetResponder={() => true}
            style={{ elevation: 16, maxWidth: responsive.window.width - 24, position: "absolute", right: dropdownPosition.right, top: dropdownPosition.top, width: Math.min(288, responsive.window.width - 24) }}
            className="rounded-md border border-primary bg-white p-3"
          >
            <View className="mb-2 flex-row items-center justify-between gap-3 border-b border-primary pb-2">
              <Text className="text-base font-semibold text-secondary_dark">{t("notifications")}</Text>
              <Text className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-secondary_dark">{recentNotifications.length}</Text>
            </View>
            <View className="gap-2">
              {recentNotifications.length === 0 ? <Text className="rounded-md bg-background p-3 text-sm text-muted">{t("notificationsEmpty")}</Text> : null}
              {recentNotifications.map((notification) => (
                <View key={notification.id} className="rounded-md border border-primary bg-background p-2">
                  <Text className="text-sm leading-5 text-secondary_dark">{formatNotification(notification, t, formatDateTime)}</Text>
                </View>
              ))}
              <AppButton label={t("viewAll")} variant="secondary" onPress={openAllNotifications} />
            </View>
          </View>
        </Pressable>
      </Modal>
      <AppModal visible={isAllVisible} onClose={() => setIsAllVisible(false)}>
        <View className="gap-4">
          <Text className="text-xl font-semibold text-secondary_dark">{t("notifications")}</Text>
          <ScrollView
            style={{ maxHeight: Math.min(520, responsive.window.height - 180) }}
            onScroll={({ nativeEvent }) => {
              const distanceFromBottom = nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height - nativeEvent.contentOffset.y;
              if (distanceFromBottom < 80) void loadMoreNotifications();
            }}
            scrollEventThrottle={250}
          >
            <View className="gap-3">
              {allNotifications.length === 0 ? <Text className="text-sm text-muted">{t("notificationsEmpty")}</Text> : null}
              {allNotifications.map((notification) => (
                <View key={notification.id} className="rounded-md border border-primary bg-background p-3">
                  <Text className="text-sm leading-5 text-secondary_dark">{formatNotification(notification, t, formatDateTime)}</Text>
                </View>
              ))}
              {isLoadingMore ? <Text className="text-center text-sm text-muted">{t("loading")}</Text> : null}
            </View>
          </ScrollView>
          <AppButton label={t("confirm")} onPress={() => setIsAllVisible(false)} className="bg-secondary_dark" />
        </View>
      </AppModal>
    </>
  );
}
