const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatWithOpenRouter(messages: ChatTurn[]) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to .env.local to enable Centsy AI."
    );
  }

  const model =
    process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "https://centsy.app",
      "X-Title": "Centsy AI",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenRouter returned an empty response");
  }
  return { content, model };
}
