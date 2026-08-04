import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  destroySession,
} from "@/lib/auth";
import { jsonOk } from "@/lib/api-utils";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  await destroySession(token);
  await clearSessionCookie();
  return jsonOk({ ok: true });
}
