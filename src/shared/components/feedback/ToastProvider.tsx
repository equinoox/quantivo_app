import { PropsWithChildren } from "react";
import Toast from "react-native-toast-message";

export function ToastProvider({ children }: PropsWithChildren) {
  return <>{children}<Toast /></>;
}
