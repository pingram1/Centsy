import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { toMode } from "@/lib/finance";
import { syncBanksForMode } from "@/lib/plaid-sync";
import { jsonError, jsonOk } from "@/lib/api-utils";

const bodySchema = z.object({
  mode: z.enum(["personal", "business"]),
});

/** Pull Plaid transactions for banks in one workspace only. */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const result = await syncBanksForMode(user.id, toMode(body.mode));
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
