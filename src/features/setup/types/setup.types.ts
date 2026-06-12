export type AppLanguage = "en" | "sr";
export type AppDateFormat = "MM/dd/yyyy" | "dd/MM/yyyy" | "yyyy-MM-dd";
export type AppCurrency = "RSD" | "EUR" | "USD";

export type SetupAdminInput = {
  id: string;
  name: string;
  password: string;
};

export type SetupStatus = {
  isComplete: boolean;
  language: AppLanguage | null;
  restaurantName: string | null;
  timezone: string;
  dateFormat: AppDateFormat;
  currency: AppCurrency;
  adminCount: number;
};

export type CompleteSetupInput = {
  language: AppLanguage;
  restaurantName: string;
  timezone: string;
  dateFormat: AppDateFormat;
  currency: AppCurrency;
  admins: SetupAdminInput[];
};
