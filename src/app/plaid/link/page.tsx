import { Suspense } from "react";
import PlaidLinkClient from "./PlaidLinkClient";

export default function PlaidLinkPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
          <p>Loading Plaid Link…</p>
        </main>
      }
    >
      <PlaidLinkClient />
    </Suspense>
  );
}
