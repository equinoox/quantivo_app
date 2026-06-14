import { router } from "expo-router";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, User } from "lucide-react-native";
import { ReactNode, useState } from "react";
import { Image, Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop, Text as SvgText } from "react-native-svg";
import { useForm } from "react-hook-form";

import { useAuthStore } from "@/features/auth/hooks/useAuthStore";
import { loginSchema, type LoginInput } from "@/features/auth/validation/auth.schemas";
import { useSetupStore } from "@/features/setup/hooks/useSetupStore";
import { AnimatedEntrance } from "@/shared/components/ui/AnimatedEntrance";
import { Screen } from "@/shared/components/ui/Screen";
import { colors } from "@/shared/constants/colors";
import { useAppToast } from "@/shared/hooks/useAppToast";
import { useI18n } from "@/shared/i18n/useI18n";

function QuantivoWordmark() {
  return (
    <View className="items-center gap-2">
      <Svg height={58} viewBox="0 0 300 58" width={300}>
        <Defs>
          <LinearGradient id="quantivoGradient" x1="0" x2="1" y1="0" y2="0">
            <Stop offset="0" stopColor="#ffb347" />
            <Stop offset="0.45" stopColor="#ff7a00" />
            <Stop offset="1" stopColor="#fb923c" />
          </LinearGradient>
        </Defs>
        <SvgText fill="url(#quantivoGradient)" fontSize="42" fontWeight="900" letterSpacing="4" textAnchor="middle" x="150" y="45">
          QUANTIVO
        </SvgText>
      </Svg>
      <View className="h-1.5 w-20 rounded-sm bg-orange" />
    </View>
  );
}

function CardDivider() {
  return (
    <View className="flex-row items-center justify-center gap-3">
      <View className="h-px w-16 bg-orange/35" />
      <View className="h-2.5 w-2.5 rotate-45 rounded-sm bg-[#ffb35c]" />
      <View className="h-px w-16 bg-orange/35" />
    </View>
  );
}

function LoginField({ icon, rightElement, ...props }: TextInputProps & { icon: ReactNode; rightElement?: ReactNode }) {
  return (
    <View className="min-h-14 flex-row items-center gap-3 rounded-xl border border-slate-300/25 bg-[#1b2026]/90 px-4">
      {icon}
      <TextInput placeholderTextColor="#a8b0bd" className="h-full flex-1 text-base font-medium text-white" {...props} />
      {rightElement}
    </View>
  );
}

export default function LoginScreen() {
  const toast = useAppToast();
  const { t } = useI18n();
  const signIn = useAuthStore((state) => state.signIn);
  const businessName = useSetupStore((state) => state.status?.restaurantName);
  const businessLogoUri = useSetupStore((state) => state.status?.businessLogoUri);
  const businessBackgroundUri = useSetupStore((state) => state.status?.businessBackgroundUri);
  const { setValue, watch } = useForm<LoginInput>({ defaultValues: { identifier: "", password: "" } });
  const formValues = watch();
  const logoSource = businessLogoUri ? { uri: businessLogoUri } : undefined;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = async () => {
    const parsed = loginSchema.safeParse(formValues);
    if (!parsed.success) {
      toast.error(t("checkLogin"));
      return;
    }
    const result = await signIn(parsed.data);
    if (!result.ok) {
      toast.error(t("invalidLogin"));
      return;
    }
    router.replace("/(tabs)/dashboard");
  };

  return (
    <Screen scrollable backgroundFallbackSource={require("../../../assets/default_bg.png")} backgroundImageUri={businessBackgroundUri} backgroundOverlayClassName="bg-slate-900/52">
      <AnimatedEntrance>
        <View className="min-h-[800px] flex-1 justify-between pb-0 pt-3">
          <QuantivoWordmark />

          <View
            className={`gap-5 self-center rounded-[24px] border border-orange/45 bg-[#242a31]/95 px-8 py-6`}
            style={{ elevation: 18, shadowColor: "#000000", shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.3, shadowRadius: 24 }}
          >
            <View className="items-center gap-3">
              {logoSource ? (
                <View className="h-32 w-32 items-center justify-center rounded-full border border-slate-200/25 bg-[#1b2026]/90 p-1.5">
                  <View className="h-full w-full items-center justify-center overflow-hidden rounded-full bg-black p-2">
                    <Image source={logoSource} className="h-full w-full" resizeMode="contain" />
                  </View>
                </View>
              ) : null}
              <View className="items-center gap-1">
                <Text className="text-center text-3xl font-bold leading-tight text-white" style={{ fontFamily: "serif", textShadowColor: "rgba(0,0,0,0.45)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }}>
                  {businessName || "Quantivo"}
                </Text>
                <Text className="text-center text-base font-semibold text-slate-300">{t("loginPrompt")}</Text>
              </View>
              <CardDivider />
            </View>

            <View className="gap-4">
              <View className="gap-2">
                <Text className="text-sm font-semibold text-white">{t("fullName")}</Text>
                <LoginField icon={<User color="#d7dce5" size={24} />} placeholder={t("fullNamePlaceholder")} autoCapitalize="words" value={formValues.identifier} onChangeText={(value) => setValue("identifier", value)} />
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-white">{t("password")}</Text>
                <LoginField
                  icon={<LockKeyhole color="#d7dce5" size={24} />}
                  placeholder={t("passwordPlaceholder")}
                  secureTextEntry={!isPasswordVisible}
                  keyboardType="number-pad"
                  value={formValues.password}
                  onChangeText={(value) => setValue("password", value.replace(/\D/g, ""))}
                  rightElement={
                    <Pressable accessibilityRole="button" onPress={() => setIsPasswordVisible((current) => !current)} className="h-10 w-10 items-center justify-center rounded-md">
                      {isPasswordVisible ? <EyeOff color="#b8c0cc" size={23} /> : <Eye color="#b8c0cc" size={23} />}
                    </Pressable>
                  }
                />
              </View>

              <Pressable accessibilityRole="button" onPress={handleSubmit} className="min-h-14 overflow-hidden rounded-xl border border-blue-500/50">
                <Svg pointerEvents="none" style={{ height: "100%", position: "absolute", width: "100%" }}>
                  <Defs>
                    <LinearGradient id="loginButtonGradient" x1="0" x2="1" y1="0" y2="0">
                      <Stop offset="0" stopColor="#172554" />
                      <Stop offset="1" stopColor="#020617" />
                    </LinearGradient>
                  </Defs>
                  <Rect fill="url(#loginButtonGradient)" height="100%" width="100%" />
                </Svg>
                <View className="min-h-14 flex-row items-center justify-center px-5">
                  <Text className="text-lg font-bold text-white">{t("login")}</Text>
                  <View className="absolute right-6">
                    <ArrowRight color={colors.orange} size={30} />
                  </View>
                </View>
              </Pressable>
            </View>

            <View className="flex-row items-center justify-center gap-4">
              <View className="h-px flex-1 bg-slate-300/35" />
              <View className="flex-row items-center gap-2">
                <ShieldCheck color="#ffb35c" size={19} />
                <Text className="text-sm font-semibold text-slate-300">{t("secureAccess")}</Text>
              </View>
              <View className="h-px flex-1 bg-slate-300/35" />
            </View>
          </View>

          <View className="items-center">
            <View className="flex-row items-center gap-2 rounded-md bg-slate-950/65 px-4 py-3">
              <ShieldCheck color="#ffb35c" size={17} />
              <Text className="text-sm font-semibold text-slate-200">{"\u00a9 2026 Quantivo. All rights reserved. Development"}</Text>
            </View>
          </View>
        </View>
      </AnimatedEntrance>
    </Screen>
  );
}
