import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { useModeStore } from "@/stores/mode-store";
import { useThemeStore } from "@/stores/theme-store";

/**
 * Deep-link landing for hosted Plaid Link return:
 * …/plaid?public_token=…&institution=…&mode=personal|business
 */
export default function PlaidReturnScreen() {
  const colors = useThemeStore((s) => s.colors);
  const storeMode = useModeStore((s) => s.mode);
  const params = useLocalSearchParams<{
    public_token?: string;
    institution?: string;
    mode?: string;
  }>();
  const [message, setMessage] = useState("Finishing bank link…");
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    const token = Array.isArray(params.public_token)
      ? params.public_token[0]
      : params.public_token;
    if (!token) {
      setMessage("Missing public token. Return to Profile → Connected banks.");
      return;
    }
    if (startedFor.current === token) return;
    startedFor.current = token;

    const institution = Array.isArray(params.institution)
      ? params.institution[0]
      : params.institution;
    const modeParam = Array.isArray(params.mode) ? params.mode[0] : params.mode;
    const mode =
      modeParam === "business" || modeParam === "personal"
        ? modeParam
        : storeMode;

    let cancelled = false;
    void (async () => {
      try {
        await api("/api/plaid/exchange", {
          method: "POST",
          body: JSON.stringify({
            public_token: token,
            institution_name: institution || undefined,
            mode,
          }),
        });
        if (cancelled) return;
        setMessage("Bank connected to this workspace.");
        router.replace("/profile/banks");
      } catch (e) {
        if (cancelled) return;
        setMessage(e instanceof Error ? e.message : "Could not link bank");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.public_token, params.institution, params.mode, storeMode]);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.foreground, textAlign: "center" }}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
});
