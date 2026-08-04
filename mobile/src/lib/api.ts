import Constants from "expo-constants";
import type { FinanceMode, VisionExtractResult } from "@centsy/shared";
import { getToken } from "@/lib/session";

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.linkingUri ?? "";
  const host = hostUri.split(":")[0];
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:3000`;
  }

  return "http://localhost:3000";
}

export const API_BASE_URL = resolveApiBaseUrl();

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : `Request failed (${res.status})`
    );
  }
  return data as T;
}

export async function extractReceipt(
  uri: string,
  mode: FinanceMode
): Promise<VisionExtractResult & { transaction?: unknown }> {
  const token = await getToken();
  const form = new FormData();
  form.append("mode", mode);
  form.append("persist", "true");
  form.append("image", {
    uri,
    name: "receipt.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const res = await fetch(`${API_BASE_URL}/api/vision/extract`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Vision extract failed (${res.status})`);
  }

  return res.json();
}
