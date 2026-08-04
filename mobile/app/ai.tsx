import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { api } from "@/lib/api";
import { useModeStore } from "@/stores/mode-store";
import { colors } from "@/theme";

interface Msg {
  id: string;
  role: string;
  content: string;
}

export default function AiScreen() {
  const mode = useModeStore((s) => s.mode);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ thread: { id: string }; messages: Msg[] }>("/api/ai/chat")
      .then((d) => {
        setThreadId(d.thread.id);
        setMessages(d.messages);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: text },
    ]);
    try {
      const res = await api<{ threadId: string; message: Msg }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: text, mode, threadId }),
      });
      setThreadId(res.threadId);
      setMessages((prev) => [...prev, res.message]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: true }} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user" || item.role === "USER"
                ? styles.user
                : styles.assistant,
            ]}
          >
            <Text
              style={{
                color:
                  item.role === "user" || item.role === "USER"
                    ? "#fff"
                    : colors.foreground,
              }}
            >
              {item.content}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Ask anything about your live spending. Centsy AI uses RAG over your
            database.
          </Text>
        }
      />
      {sending ? <ActivityIndicator color={colors.primary} /> : null}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Centsy AI…"
          placeholderTextColor={colors.muted}
        />
        <Pressable style={styles.send} onPress={() => void send()}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  bubble: { maxWidth: "90%", borderRadius: 16, padding: 12 },
  user: { alignSelf: "flex-end", backgroundColor: colors.primary },
  assistant: {
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: { color: colors.muted, lineHeight: 20 },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
    color: colors.foreground,
  },
  send: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontWeight: "700" },
  error: { color: colors.danger, padding: 12, fontSize: 12 },
});
