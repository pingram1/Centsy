import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandLogo } from "@/components/BrandLogo";
import { api } from "@/lib/api";
import { setToken } from "@/lib/session";
import { colors } from "@/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, fullName: fullName || "Centsy User" };
      const res = await api<{ token: string }>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      await setToken(res.token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <BrandLogo size="lg" style={styles.logo} />
      <Text style={styles.title}>
        {mode === "login" ? "Sign in" : "Create account"}
      </Text>
      <Text style={styles.sub}>Live Centsy account for Expo Go testing</Text>

      {mode === "signup" ? (
        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor={colors.muted}
          value={fullName}
          onChangeText={setFullName}
        />
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={colors.muted}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password (8+ chars)"
        secureTextEntry
        placeholderTextColor={colors.muted}
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.btn} onPress={() => void submit()} disabled={loading}>
        <Text style={styles.btnText}>
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setMode(mode === "login" ? "signup" : "login")}
      >
        <Text style={styles.switch}>
          {mode === "login"
            ? "Need an account? Sign up"
            : "Have an account? Sign in"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: "center",
    gap: 12,
  },
  logo: { marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "700", color: colors.foreground },
  sub: { color: colors.muted, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.foreground,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  switch: {
    textAlign: "center",
    color: colors.primary,
    fontWeight: "600",
    marginTop: 8,
  },
  error: { color: colors.danger, fontSize: 13 },
});
