import { ReactNode, useRef, useState } from "react";
import { Dimensions, Modal, Pressable, ScrollView, Text, View, ViewProps } from "react-native";
import clsx from "clsx";
import { Bell, ChevronLeft } from "lucide-react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { listInventoryNotifications } from "@/features/notifications/services/notifications.service";
import { InventoryNotification } from "@/features/notifications/types/notification.types";
import { useAppFormatters } from "@/features/setup/hooks/useAppFormatters";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppModal } from "@/shared/components/ui/AppModal";
import { colors } from "@/shared/constants/colors";
import { useI18n } from "@/shared/i18n/useI18n";

type AngledHeaderProps = ViewProps & {
  icon?: ReactNode;
  kicker?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  title: string;
  subtitle?: string;
  compact?: boolean;
  showDate?: boolean;
  showNotifications?: boolean;
};

const notificationsPageSize = 20;

function formatNotification(notification: InventoryNotification, t: (key: string) => string, formatDateTime: (value: string) => string): string {
  if (notification.type === "shift_finished") {
    const shift = notification.shift === "first" ? t("firstShift") : t("secondShift");
    return `${notification.actorNameSnapshot} ${t("finishedShiftCount")} ${notification.inventoryDate ?? ""} | ${shift} | ${formatDateTime(notification.createdAt)}`;
  }

  return `${notification.actorNameSnapshot} | ${notification.productNameSnapshot ?? ""} | ${notification.columnLabelSnapshot ?? ""} | ${notification.oldValue ?? 0} -> ${notification.newValue ?? 0} | ${formatDateTime(notification.createdAt)}`;
}

export function AngledHeader({ icon, kicker, onBack, showBackButton = false, title, subtitle, compact = false, showDate = true, showNotifications = false, className, ...props }: AngledHeaderProps) {
  const { t } = useI18n();
  const session = useAuthStore((state) => state.session);
  const { formatDate, formatDateTime } = useAppFormatters();
  const currentDate = formatDate(new Date());
  const canSeeNotifications = showNotifications && session?.user.role === "admin";
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
        const screenWidth = Dimensions.get("window").width;
        setDropdownPosition({
          right: Math.max(12, screenWidth - x - width),
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
      <View className={clsx("bg-secondary_dark px-5", compact ? "pb-9 pt-8" : "pb-12 pt-10", className)} {...props}>
        <View className="gap-3">
          {kicker ? <Text className="text-xs font-semibold uppercase tracking-widest text-orange">{kicker}</Text> : null}
          <View className="flex-row items-center gap-3">
            {showBackButton ? (
              <Pressable accessibilityRole="button" onPress={onBack} className="h-10 w-10 items-center justify-center rounded-md">
                <ChevronLeft color={colors.orange} size={28} />
              </Pressable>
            ) : null}
            {icon ? <View className="h-14 w-14 items-center justify-center bg-primary rounded-md">{icon}</View> : null}
            <Text className={clsx("flex-1 font-bold leading-tight text-text_color_2", compact ? "text-2xl" : "text-3xl")}>{title}</Text>
            <View className="flex-row items-center gap-2">
              {showDate ? (
                <View className="rounded-md bg-primary px-3 py-2">
                  <Text className="text-xs font-semibold text-secondary_dark">{currentDate}</Text>
                </View>
              ) : null}
              {canSeeNotifications ? (
                <Pressable ref={bellRef} accessibilityRole="button" onPress={toggleNotifications} className="h-10 w-10 items-center justify-center rounded-md bg-primary">
                  <Bell color={colors.secondaryDark} size={20} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>
      <Modal transparent visible={canSeeNotifications && isDropdownVisible} animationType="fade" onRequestClose={() => setIsDropdownVisible(false)}>
        <Pressable className="flex-1 bg-transparent" onPress={() => setIsDropdownVisible(false)}>
          <View
            onStartShouldSetResponder={() => true}
            style={{ elevation: 16, position: "absolute", right: dropdownPosition.right, top: dropdownPosition.top, width: 288 }}
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
            className="max-h-[520px]"
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
