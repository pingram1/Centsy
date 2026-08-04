"use client";

import { useRef, useState } from "react";
import {
  Camera,
  ImagePlus,
  Loader2,
  Plus,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useModeStore } from "@/stores/mode-store";
import { categoryLabel, formatCurrency, modeLabel } from "@/lib/format";
import type { VisionExtractResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type Stage = "upload" | "processing" | "review";

interface AddTransactionDialogProps {
  /** `fab` = phone bottom-nav snap button; `button` = desktop header CTA */
  triggerVariant?: "fab" | "button";
}

export function AddTransactionDialog({
  triggerVariant = "button",
}: AddTransactionDialogProps) {
  const mode = useModeStore((s) => s.mode);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<VisionExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStage("upload");
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResult(null);
    setError(null);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setStage("processing");

    try {
      const form = new FormData();
      form.append("image", file);
      form.append("mode", mode);

      const res = await fetch("/api/vision/extract", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        throw new Error("Vision extraction failed");
      }

      const data = (await res.json()) as VisionExtractResult;
      setResult(data);
      setStage("review");
    } catch {
      setError("Couldn’t read that image. Try a clearer receipt photo.");
      setStage("upload");
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <SheetTrigger
        render={
          triggerVariant === "fab" ? (
            <button
              type="button"
              className="-mt-7 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/35 ring-4 ring-background transition-transform active:scale-95"
              aria-label="Snap receipt"
            />
          ) : (
            <Button
              size="lg"
              className="h-10 gap-1.5 shadow-md shadow-primary/20"
            />
          )
        }
      >
        {triggerVariant === "fab" ? (
          <Camera className="size-6" />
        ) : (
          <>
            <Plus className="size-4" data-icon="inline-start" />
            Add Transaction
          </>
        )}
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[min(92dvh,720px)] gap-0 rounded-t-3xl p-0 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" aria-hidden />
        <SheetHeader className="px-5 pt-4 pb-2 text-left">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-4 text-primary" />
            Snap a receipt
          </SheetTitle>
          <SheetDescription>
            Point your camera at a receipt, invoice, or POS screen. Saved to{" "}
            <span className="font-medium text-foreground">
              {modeLabel(mode)}
            </span>{" "}
            mode.
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto px-5 py-3">
          {stage === "upload" ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/35 bg-gradient-to-b from-primary/10 to-transparent px-4 py-12 text-center transition-all active:scale-[0.99]"
              >
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                  <Camera className="size-6" />
                </div>
                <div>
                  <p className="text-base font-semibold">Open camera</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Fastest way — snap and go
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left active:bg-muted/60"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <ImagePlus className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Choose from photos</p>
                  <p className="text-xs text-muted-foreground">
                    Gallery · JPG, PNG, HEIC
                  </p>
                </div>
              </button>

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          ) : null}

          {stage === "processing" ? (
            <div className="flex flex-col items-center gap-4 py-12">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="h-36 w-auto rounded-xl object-cover opacity-90 ring-1 ring-border"
                />
              ) : null}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                Reading receipt…
              </div>
            </div>
          ) : null}

          {stage === "review" && result ? (
            <div className="space-y-4 pb-2">
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Merchant</p>
                    <p className="text-lg font-semibold">{result.merchant}</p>
                  </div>
                  <Badge variant="secondary">
                    {Math.round(result.confidence * 100)}% conf.
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold tabular-nums">
                      {formatCurrency(result.total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">{result.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bucket</p>
                    <p className="font-medium">
                      {categoryLabel(result.category)}
                    </p>
                  </div>
                </div>
              </div>

              {result.lineItems.length > 0 ? (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ReceiptText className="size-3.5" />
                    Line items
                  </p>
                  <ul className="max-h-40 space-y-1.5 overflow-auto rounded-xl border border-border p-2">
                    {result.lineItems.map((item) => (
                      <li
                        key={`${item.name}-${item.amount}`}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-2.5 py-2 text-sm"
                        )}
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatCurrency(item.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {stage === "review" ? (
          <SheetFooter className="border-t border-border px-5 py-4 sm:flex-row">
            <Button
              variant="outline"
              className="h-11 flex-1"
              onClick={reset}
            >
              Retake
            </Button>
            <Button
              className="h-11 flex-1"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Save to {modeLabel(mode)}
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
 