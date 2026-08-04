import Link from "next/link";
import type { Metadata } from "next";
import { Home, Share } from "lucide-react";
import { Logo } from "@/components/branding/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Welcome",
};

export default function WelcomePage() {
  return (
    <div className="centsy-atmosphere relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 left-1/2 h-64 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 bottom-20 h-56 w-56 rounded-full bg-insight/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <header className="centsy-animate-in flex items-center justify-between py-3">
          <Logo size="sm" />
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-3"
            render={<Link href="/login" />}
          >
            Log in
          </Button>
        </header>

        <main className="flex flex-1 flex-col justify-center py-8">
          <div className="mx-auto mb-8 flex size-20 items-center justify-center rounded-[1.75rem] bg-primary/10 ring-1 ring-primary/20 centsy-animate-in overflow-hidden">
            <Logo showWordmark={false} size="lg" className="size-14" />
          </div>

          <p className="centsy-animate-in centsy-animate-in-delay-1 text-center text-sm font-medium tracking-wide text-primary">
            Built for your phone
          </p>
          <h1 className="centsy-animate-in centsy-animate-in-delay-2 mt-3 text-center text-[2.5rem] font-semibold leading-[1.05] tracking-tight">
            Snap. Sort.
            <br />
            Stay sharp.
          </h1>
          <p className="centsy-animate-in centsy-animate-in-delay-3 mx-auto mt-4 max-w-sm text-center text-base leading-relaxed text-muted-foreground">
            Centsy lives on your home screen. Capture a receipt in seconds,
            toggle Personal or Business, and get coaching that puts surplus to
            work.
          </p>

          <div className="centsy-animate-in centsy-animate-in-delay-4 mt-8 flex flex-col gap-3">
            <Button
              size="lg"
              className="h-12 w-full text-base shadow-lg shadow-primary/25"
              render={<Link href="/signup" />}
            >
              Get started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full bg-card/70 text-base backdrop-blur-sm"
              render={<Link href="/dashboard" />}
            >
              Open demo on this phone
            </Button>
          </div>

          <div className="mt-10 rounded-2xl border border-border/70 bg-card/75 p-4 backdrop-blur-sm">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Home className="size-4 text-primary" />
              Add to Home Screen
            </p>
            <ol className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-medium text-foreground">iPhone</span>
                <span className="inline-flex items-center gap-1">
                  Share <Share className="size-3.5" /> → Add to Home Screen
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">Android</span>
                <span>Browser menu → Install app / Add to Home screen</span>
              </li>
            </ol>
          </div>
        </main>
      </div>
    </div>
  );
}
