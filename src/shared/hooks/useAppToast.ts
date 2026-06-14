import Toast from "react-native-toast-message";

export function useAppToast() {
  return {
    success: (text1: string, text2?: string) => Toast.show({ type: "success", text1, text2, visibilityTime: text2 ? 6500 : 3500 }),
    error: (text1: string, text2?: string) => Toast.show({ type: "error", text1, text2, visibilityTime: text2 ? 8000 : 5000 }),
    info: (text1: string, text2?: string) => Toast.show({ type: "info", text1, text2, visibilityTime: text2 ? 6500 : 3500 }),
  };
}
