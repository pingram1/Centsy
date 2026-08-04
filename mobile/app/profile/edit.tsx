import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { api } from "@/lib/api";
import { useThemeStore } from "@/stores/theme-store";

export default function EditProfileScreen() {
  const colors = useThemeStore((s) => s.colors);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ user: { fullName: string; email: string } }>("/api/auth/me")
      .then((d) => {
        setFullName(d.user.fullName);
        setEmail(d.user.email);
      })
      .catch(() => Alert.alert("Sign in required"));
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      await api("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ fullName, email }),
      });
      Alert.alert("Saved", "Profile updated.");
    } catch (e) {
      Alert.alert("Couldn’t save", e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    setSaving(true);
    try {
      await api("/api/auth/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      Alert.alert("Password updated");
    } catch (e) {
      Alert.alert("Couldn’t update", e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = [
    styles.input,
    {
      borderColor: colors.border,
      backgroundColor: colors.card,
      color: colors.foreground,
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Stack.Screen options={{ title: "Edit profile" }} />
      <Text style={[styles.label, { color: colors.muted }]}>Full name</Text>
      <TextInput style={inputStyle} value={fullName} onChangeText={setFullName} />
      <Text style={[styles.label, { color: colors.muted }]}>Email</Text>
      <TextInput
        style={inputStyle}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Pressable
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={() => void saveProfile()}
        disabled={saving}
      >
        <Text style={styles.btnText}>{saving ? "Saving…" : "Save profile"}</Text>
      </Pressable>

      <Text style={[styles.section, { color: colors.foreground }]}>
        Change password
      </Text>
      <TextInput
        style={inputStyle}
        placeholder="Current password"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <TextInput
        style={inputStyle}
        placeholder="New password (8+)"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <Pressable
        style={[styles.btn, { backgroundColor: colors.foreground }]}
        onPress={() => void savePassword()}
        disabled={saving}
      >
        <Text style={styles.btnText}>Update password</Text>
      </Pressable>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: colors.primary, textAlign: "center", marginTop: 8 }}>
          Done
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 10 },
  label: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  section: { marginTop: 20, fontSize: 17, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
