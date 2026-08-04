import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { api } from "@/lib/api";
import { useThemeStore } from "@/stores/theme-store";

type Memory = {
  id: string;
  key: string;
  value: string;
  source: string | null;
  updatedAt: string;
};

export default function MemoriesScreen() {
  const colors = useThemeStore((s) => s.colors);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ memories: Memory[] }>("/api/ai/memories");
      setMemories(data.memories);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  function remove(memory: Memory) {
    Alert.alert("Delete memory?", memory.key, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            await api("/api/ai/memories", {
              method: "DELETE",
              body: JSON.stringify({ id: memory.id }),
            });
            setMemories((prev) => prev.filter((m) => m.id !== memory.id));
          })();
        },
      },
    ]);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.wrap}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => void load()} />
      }
    >
      <Stack.Screen options={{ title: "AI memory vault" }} />
      <Text style={[styles.copy, { color: colors.muted }]}>
        Memories Centsy AI can use for context. Review and delete anything you
        don’t want retained. AI coaching preferences stay developer-controlled
        until the model is proven across users.
      </Text>
      {loading && memories.length === 0 ? (
        <ActivityIndicator color={colors.primary} />
      ) : null}
      {memories.length === 0 && !loading ? (
        <Text style={{ color: colors.muted, textAlign: "center", marginTop: 24 }}>
          No memories yet. They appear as you chat with Centsy AI.
        </Text>
      ) : null}
      {memories.map((m) => (
        <View
          key={m.id}
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.key, { color: colors.foreground }]}>{m.key}</Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
            {m.value}
          </Text>
          <Pressable onPress={() => remove(m)} style={{ marginTop: 8 }}>
            <Text style={{ color: colors.danger, fontWeight: "600" }}>Delete</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 10, paddingBottom: 32 },
  copy: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  key: { fontSize: 15, fontWeight: "700" },
});
