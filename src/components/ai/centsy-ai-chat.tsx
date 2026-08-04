"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Logo } from "@/components/branding/logo";
import { Button } from "@/components/ui/button";
import { useModeStore } from "@/stores/mode-store";
import { api } from "@/lib/client-api";
import { modeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export function CentsyAiChat() {
  const mode = useModeStore((s) => s.mode);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ thread: { id: string }; messages: ChatMessage[] }>("/api/ai/chat")
      .then((data) => {
        setThreadId(data.thread.id);
        setMessages(data.messages);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setError(null);

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await api<{
        threadId: string;
        message: ChatMessage;
      }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          mode,
          threadId: threadId ?? undefined,
        }),
      });
      setThreadId(res.threadId);
      setMessages((prev) => [...prev, res.message]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach Centsy AI");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading Centsy AI…
      </div>
    );
  }

  return (
    <div className="flex h-[min(70vh,720px)] flex-col overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Logo showWordmark={false} size="sm" className="size-8 rounded-xl" />
        <div>
          <p className="text-sm font-semibold">Centsy AI</p>
          <p className="text-xs text-muted-foreground">
            Learns your patterns · context: {modeLabel(mode)}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            Ask anything about your spending, categories, or Personal vs
            Business split. Try: “Where am I overspending this month?”
          </div>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              m.role === "user" || m.role === "USER"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted/70 text-foreground"
            )}
          >
            {m.content}
          </div>
        ))}
        {sending ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Thinking with your live ledger…
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="px-4 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Ask Centsy AI…"
          className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          className="h-11 px-4"
          onClick={() => void send()}
          disabled={sending || !input.trim()}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
