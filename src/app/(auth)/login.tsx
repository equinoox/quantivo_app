import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { Text, View } from "react-native";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { loginSchema, type LoginInput } from "@/features/auth/validation/auth.schemas";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/AppInput";
import { Screen } from "@/shared/components/ui/Screen";
import { useAppToast } from "@/shared/hooks/useAppToast";

export default function LoginScreen() {
  const toast = useAppToast();
  const signInPlaceholder = useAuthStore((state) => state.signInPlaceholder);
  const { setValue, watch } = useForm<LoginInput>({ defaultValues: { identifier: "", password: "" } });
  const formValues = watch();

  const handleSubmit = async () => {
    const parsed = loginSchema.safeParse(formValues);
    if (!parsed.success) {
      toast.error("Check your login details");
      return;
    }
    await signInPlaceholder(parsed.data.identifier);
    router.replace("/(tabs)/dashboard");
  };

  return (
    <Screen scrollable>
      <View className="gap-6">
        <View>
          <Text className="text-3xl font-bold text-ink">Quantivo</Text>
          <Text className="mt-2 text-base text-muted">Local inventory workspace scaffold</Text>
        </View>
        <View className="gap-4">
          <AppInput label="Username or email" autoCapitalize="none" value={formValues.identifier} onChangeText={(value) => setValue("identifier", value)} />
          <AppInput label="Password" secureTextEntry value={formValues.password} onChangeText={(value) => setValue("password", value)} />
          <AppButton label="Log in" onPress={handleSubmit} />
          <AppButton label="Create account" variant="secondary" onPress={() => router.push("/(auth)/register")} />
        </View>
      </View>
    </Screen>
  );
}
