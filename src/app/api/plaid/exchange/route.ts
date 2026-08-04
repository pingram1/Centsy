import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getPlaidClient } from "@/lib/plaid";
import { fromMode, toMode } from "@/lib/finance";
import { jsonError, jsonOk } from "@/lib/api-utils";

const schema = z.object({
  public_token: z.string().min(1),
  /** Required — banks belong to exactly one workspace realm */
  mode: z.enum(["personal", "business"]),
  institution_name: z.string().min(1).optional(),
  account_name: z.string().min(1).optional(),
  mask: z.string().optional(),
  type: z.enum(["checking", "savings", "credit"]).optional(),
});

function serializeBank(bank: {
  id: string;
  mode: "PERSONAL" | "BUSINESS";
  institutionName: string;
  accountName: string;
  mask: string;
  type: string;
  balance: { toString(): string };
}) {
  return {
    id: bank.id,
    mode: fromMode(bank.mode),
    institutionName: bank.institutionName,
    accountName: bank.accountName,
    mask: bank.mask,
    type: bank.type,
    balance: bank.balance.toString(),
  };
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());
    const mode = toMode(body.mode);
    const { client } = getPlaidClient();

    const exchanged = await client.itemPublicTokenExchange({
      public_token: body.public_token,
    });

    const accessToken = exchanged.data.access_token;
    const itemId = exchanged.data.item_id;

    const existing = await prisma.bankAccount.findFirst({
      where: { userId: user.id, plaidItemId: itemId },
    });
    if (existing) {
      if (existing.mode !== mode) {
        return jsonError(
          new Error(
            "This bank is already linked in your other workspace. Disconnect it there first, or connect a different account here."
          ),
          409
        );
      }
      return jsonOk({
        bankAccount: serializeBank(existing),
        deduped: true,
      });
    }

    const accounts = await client.accountsGet({ access_token: accessToken });
    const primary = accounts.data.accounts[0];

    const bank = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        mode,
        institutionName: body.institution_name || "Linked bank",
        accountName:
          body.account_name || primary?.name || primary?.official_name || "Account",
        mask: body.mask || primary?.mask || "****",
        type:
          body.type === "savings"
            ? "SAVINGS"
            : body.type === "credit"
              ? "CREDIT"
              : "CHECKING",
        balance: primary?.balances.current ?? 0,
        plaidItemId: itemId,
        plaidAccessEnc: accessToken,
      },
    });

    return jsonOk({ bankAccount: serializeBank(bank) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const modeParam = new URL(request.url).searchParams.get("mode");
    if (modeParam !== "personal" && modeParam !== "business") {
      return jsonError(
        new Error("mode=personal|business is required — workspaces stay separate."),
        400
      );
    }
    const mode = toMode(modeParam);
    const accounts = await prisma.bankAccount.findMany({
      where: { userId: user.id, mode },
      orderBy: { connectedAt: "desc" },
      select: {
        id: true,
        mode: true,
        institutionName: true,
        accountName: true,
        mask: true,
        type: true,
        balance: true,
        connectedAt: true,
      },
    });
    return jsonOk({
      mode: modeParam,
      accounts: accounts.map((a) => ({
        ...serializeBank(a),
        connectedAt: a.connectedAt,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
