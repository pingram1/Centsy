import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useModeStore } from "@/stores/mode-store";
import { getToken } from "@/lib/session";
import { API_BASE_URL } from "@/lib/api";
import { useThemeStore } from "@/stores/theme-store";

export default function ExportScreen() {
  const colors = useThemeStore((s) => s.colors);
  const mode = useModeStore((s) => s.mode);
  const [busy, setBusy] = useState(false);

  async function exportLedger(scope: "current" | "all") {
    setBusy(true);
    try {
      const token = await getToken();
      const qs = scope === "current" ? `?mode=${mode}` : "";
      const res = await fetch(`${API_BASE_URL}/api/export/ledger${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Export failed");
      }
      const csv = await res.text();
      const path = `${FileSystem.cacheDirectory}centsy-export-${scope}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: "text/csv",
          dialogTitle: "Export Centsy ledger",
        });
      } else {
        Alert.alert("Exported", `Saved to ${path}`);
      }
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Stack.Screen options={{ title: "Export center" }} />
      <Text style={[styles.copy, { color: colors.muted }]}>
        Download a tax-ready CSV of transactions and mileage. Keep copies with
        your filed returns. IRS guidance: generally retain supporting records
        at least 3 years after filing (Pub. 583); employment tax records 4+
        years.
      </Text>
      <Pressable
        style={[styles.btn, { backgroundColor: colors.primary }]}
        disabled={busy}
        onPress={() => void exportLedger("current")}
      >
        <Text style={styles.btnText}>
          {busy ? "Preparing…" : `Export ${mode} workspace`}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.btnOutline, { borderColor: colors.border }]}
        disabled={busy}
        onPress={() => void exportLedger("all")}
      >
        <Text style={{ color: colors.foreground, fontWeight: "700" }}>
          Export all workspaces
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  copy: { fontSize: 13, lineHeight: 19 },
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnOutline: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
