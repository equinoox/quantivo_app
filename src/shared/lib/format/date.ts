import { AppDateFormat } from "@/features/setup/types/setup.types";

type AppDateSettings = {
  dateFormat?: AppDateFormat;
  timezone?: string;
};

const fallbackSettings: Required<AppDateSettings> = {
  dateFormat: "dd/MM/yyyy",
  timezone: "Europe/Belgrade",
};

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function getDateParts(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(value);

  return {
    day: parts.find((part) => part.type === "day")?.value ?? pad(value.getDate()),
    month: parts.find((part) => part.type === "month")?.value ?? pad(value.getMonth() + 1),
    year: parts.find((part) => part.type === "year")?.value ?? value.getFullYear().toString(),
  };
}

export function formatAppDate(value: Date | string | number, settings: AppDateSettings = {}): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const dateFormat = settings.dateFormat ?? fallbackSettings.dateFormat;
  const timezone = settings.timezone ?? fallbackSettings.timezone;
  const parts = getDateParts(date, timezone);

  return dateFormat.replace("dd", parts.day).replace("MM", parts.month).replace("yyyy", parts.year);
}
