"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AcceptInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [message, setMessage] = useState("Accepting invite…");

  useEffect(() => {
    if (!token) {
      setMessage("Missing invite token.");
      return;
    }
    void fetch("/api/accountant/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Accept failed"
          );
        }
        setMessage(
          `Access granted for ${data.invite?.businessName || data.invite?.ownerName || "business"} (read-only). Sign in to Centsy with this email when accountant login ships.`
        );
      })
      .catch((e: Error) => setMessage(e.message));
  }, [token]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif",
        padding: 24,
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <p style={{ lineHeight: 1.5 }}>{message}</p>
    </main>
  );
}

export default function AccountantAcceptPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Loading…</p>}>
      <AcceptInner />
    </Suspense>
  );
}
