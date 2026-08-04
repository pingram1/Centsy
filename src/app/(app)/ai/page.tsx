import type { Metadata } from "next";
import { CentsyAiChat } from "@/components/ai/centsy-ai-chat";

export const metadata: Metadata = {
  title: "Centsy AI",
};

export default function AiPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Centsy AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your on-demand financial brain — grounded in your live transactions,
          mileage, and Personal/Business split via RAG.
        </p>
      </div>
      <CentsyAiChat />
    </div>
  );
}
