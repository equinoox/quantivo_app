import { useCallback } from "react";

import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { formatAppDate } from "@/shared/lib/format/date";
import { formatAppMoney } from "@/shared/lib/format/money";

export function useAppFormatters() {
  const settings = useSetupStore((state) => state.status);

  const formatDate = useCallback(
    (value: Date | string | number) => formatAppDate(value, { dateFormat: settings?.dateFormat, timezone: settings?.timezone }),
    [settings?.dateFormat, settings?.timezone],
  );

  const formatMoney = useCallback(
    (value: number) => formatAppMoney(value, { currency: settings?.currency, language: settings?.language }),
    [settings?.currency, settings?.language],
  );

  return { formatDate, formatMoney };
}
