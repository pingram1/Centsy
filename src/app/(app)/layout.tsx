import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="centsy-atmosphere flex min-h-dvh">
      {/* Desktop enhancement — phone is the primary surface */}
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-5 lg:max-w-none lg:px-8 lg:py-6 lg:pb-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
