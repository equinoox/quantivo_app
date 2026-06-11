import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { Text, View } from "react-native";

import { registerSchema, type RegisterInput } from "@/features/auth/validation/auth.schemas";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/AppInput";
import { Screen } from "@/shared/components/ui/Screen";
import { useAppToast } from "@/shared/hooks/useAppToast";

export default function RegisterScreen() {
  const toast = useAppToast();
  const { setValue, watch } = useForm<RegisterInput>({ defaultValues: { name: "", email: "", password: "" } });
  const formValues = watch();

  const handleSubmit = () => {
    const parsed = registerSchema.safeParse(formValues);
    if (!parsed.success) {
      toast.error("Check your registration details");
      return;
    }
    toast.info("Registration flow is prepared, not implemented yet");
  };

  return (
    <Screen scrollable>
      <View className="gap-6">
        <View>
          <Text className="text-3xl font-bold text-ink">Create account</Text>
          <Text className="mt-2 text-base text-muted">Placeholder local registration screen</Text>
        </View>
        <View className="gap-4">
          <AppInput label="Name" value={formValues.name} onChangeText={(value) => setValue("name", value)} />
          <AppInput label="Email" autoCapitalize="none" keyboardType="email-address" value={formValues.email} onChangeText={(value) => setValue("email", value)} />
          <AppInput label="Password" secureTextEntry value={formValues.password} onChangeText={(value) => setValue("password", value)} />
          <AppButton label="Prepare account" onPress={handleSubmit} />
          <AppButton label="Back to login" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
