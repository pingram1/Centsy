import { requireUser } from "@/lib/auth";
import {
  deriveInsights,
  getMonthlySummary,
  listTransactions,
  toMode,
} from "@/lib/finance";
import { jsonError, jsonOk } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const mode = toMode(searchParams.get("mode"));

    const [summary, transactions, insights] = await Promise.all([
      getMonthlySummary(user.id, mode),
      listTransactions(user.id, mode, 8),
      deriveInsights(user.id, mode),
    ]);

    return jsonOk({ summary, transactions, insights });
  } catch (error) {
    return jsonError(error);
  }
}
