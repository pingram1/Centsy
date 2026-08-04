import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  categoryLabel,
  formatCurrency,
  modeLabel,
  type VisionExtractResult,
} from "@centsy/shared";
import { extractReceipt } from "@/lib/api";
import { useModeStore } from "@/stores/mode-store";
import { colors } from "@/theme";

type Stage = "idle" | "processing" | "review";

export default function SnapScreen() {
  const mode = useModeStore((s) => s.mode);
  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<VisionExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function processUri(uri: string) {
    setError(null);
    setPreview(uri);
    setStage("processing");
    try {
      const data = await extractReceipt(uri, mode);
      setResult(data);
      setStage("review");
    } catch {
      setError(
        "Couldn’t reach Vision API. Is Next.js running and EXPO_PUBLIC_API_URL correct?"
      );
      setStage("idle");
    }
  }

  async function openCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Camera permission is required to snap receipts.");
      return;
    }
    const photo = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!photo.canceled && photo.assets[0]) {
      await processUri(photo.assets[0].uri);
    }
  }

  async function openLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library permission is required.");
      return;
    }
    const photo = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!photo.canceled && photo.assets[0]) {
      await processUri(photo.assets[0].uri);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Capture saves into{" "}
        <Text style={styles.leadStrong}>{modeLabel(mode)}</Text> mode.
      </Text>

      {stage === "idle" ? (
        <View style={styles.actions}>
          <Pressable style={styles.primary} onPress={openCamera}>
            <Text style={styles.primaryText}>Open camera</Text>
            <Text style={styles.primarySub}>Fastest — snap and go</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={openLibrary}>
            <Text style={styles.secondaryText}>Choose from photos</Text>
          </Pressable>
        </View>
      ) : null}

      {stage === "processing" ? (
        <View style={styles.center}>
          {preview ? (
            <Image source={{ uri: preview }} style={styles.preview} />
          ) : null}
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.processing}>Reading receipt…</Text>
        </View>
      ) : null}

      {stage === "review" && result ? (
        <View style={styles.review}>
          <View style={styles.card}>
            <Text style={styles.label}>Merchant</Text>
            <Text style={styles.merchant}>{result.merchant}</Text>
            <View style={styles.grid}>
              <View style={styles.cell}>
                <Text style={styles.label}>Total</Text>
                <Text style={styles.cellValue}>
                  {formatCurrency(result.total)}
                </Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.cellValue}>{result.date}</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.label}>Bucket</Text>
                <Text style={styles.cellValue}>
                  {categoryLabel(result.category)}
                </Text>
              </View>
            </View>
          </View>

          {result.lineItems.map((item) => (
            <View key={`${item.name}-${item.amount}`} style={styles.line}>
              <Text style={styles.lineName}>{item.name}</Text>
              <Text style={styles.lineAmt}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}

          <Pressable
            style={styles.primary}
            onPress={() => {
              setStage("idle");
              setResult(null);
              setPreview(null);
              router.back();
            }}
          >
            <Text style={styles.primaryText}>Save to {modeLabel(mode)}</Text>
          </Pressable>
          <Pressable
            style={styles.secondary}
            onPress={() => {
              setStage("idle");
              setResult(null);
              setPreview(null);
            }}
          >
            <Text style={styles.secondaryText}>Retake</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  lead: { fontSize: 15, color: colors.muted, lineHeight: 22 },
  leadStrong: { color: colors.foreground, fontWeight: "700" },
  actions: { gap: 10, marginTop: 8 },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  primarySub: { marginTop: 4, color: "rgba(255,255,255,0.85)", fontSize: 13 },
  secondary: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryText: { color: colors.foreground, fontWeight: "600", fontSize: 15 },
  center: { alignItems: "center", gap: 14, paddingVertical: 32 },
  preview: { width: 160, height: 200, borderRadius: 12, backgroundColor: colors.border },
  processing: { color: colors.muted },
  review: { gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  label: { fontSize: 12, color: colors.muted, fontWeight: "500" },
  merchant: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
  },
  grid: { flexDirection: "row", marginTop: 16, gap: 8 },
  cell: { flex: 1 },
  cellValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  lineName: { color: colors.foreground, fontSize: 14 },
  lineAmt: { color: colors.muted, fontWeight: "600" },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
});
