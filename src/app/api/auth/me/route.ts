import { requireUser } from "@/lib/auth";
import { fromMode } from "@/lib/finance";
import { jsonError, jsonOk } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return jsonOk({
      user: {
        ...user,
        defaultMode: fromMode(user.defaultMode),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
