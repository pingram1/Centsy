"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Hosted Plaid Link bridge for Expo / web.
 * Open with ?link_token=…&return_url=…&env=sandbox
 */
export default function PlaidLinkClient() {
  const params = useSearchParams();
  const linkToken = params.get("link_token");
  const returnUrl = params.get("return_url") || "centsy://plaid";
  const env = params.get("env") || "sandbox";
  const [status, setStatus] = useState("Loading Plaid Link…");

  useEffect(() => {
    if (!linkToken) {
      setStatus("Missing link_token");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    script.async = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Plaid = (window as any).Plaid;
      if (!Plaid) {
        setStatus("Plaid failed to load");
        return;
      }
      const handler = Plaid.create({
        token: linkToken,
        onSuccess: (
          public_token: string,
          metadata: { institution?: { name?: string } }
        ) => {
          const sep = returnUrl.includes("?") ? "&" : "?";
          const parts = [
            `public_token=${encodeURIComponent(public_token)}`,
          ];
          if (metadata.institution?.name) {
            parts.push(
              `institution=${encodeURIComponent(metadata.institution.name)}`
            );
          }
          setStatus("Connected — returning to Centsy…");
          window.location.href = `${returnUrl}${sep}${parts.join("&")}`;
        },
        onExit: (err: unknown) => {
          setStatus(
            err
              ? "Link closed with an error. You can close this tab."
              : "Link closed. You can return to Centsy."
          );
        },
      });
      handler.open();
      setStatus("Plaid Link open");
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [linkToken, returnUrl]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif",
        padding: 24,
        textAlign: "center",
        gap: 12,
      }}
    >
      <p style={{ margin: 0 }}>{status}</p>
      {env === "sandbox" ? (
        <p style={{ margin: 0, maxWidth: 360, color: "#555", fontSize: 14, lineHeight: 1.45 }}>
          Sandbox tip: pick any test bank, then sign in with a persona — Default
          is <strong>user_good</strong> / <strong>pass_good</strong>.
        </p>
      ) : null}
    </main>
  );
}
