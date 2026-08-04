import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getPlaidClient } from "@/lib/plaid";
import { fromMode, toMode } from "@/lib/finance";
import { jsonError, jsonOk } from "@/lib/api-utils";

const bodySchema = z.object({
  mode: z.enum(["personal", "business"]),
});

/**
 * Sandbox-only: create + exchange a public token without native Plaid Link.
 * Still scoped to one workspace realm.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const mode = toMode(body.mode);
    const { client, env, Products } = getPlaidClient();
    if (env !== "sandbox") {
      return jsonError(
        new Error("Sandbox connect is only available when PLAID_ENV=sandbox."),
        403
      );
    }

    const sandbox = await client.sandboxPublicTokenCreate({
      institution_id: "ins_109508",
      initial_products: [Products.Transactions],
    });

    const exchanged = await client.itemPublicTokenExchange({
      public_token: sandbox.data.public_token,
    });

    const accessToken = exchanged.data.access_token;
    const accounts = await client.accountsGet({ access_token: accessToken });
    const primary = accounts.data.accounts[0];

    const bank = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        mode,
        institutionName: "First Platypus Bank",
        accountName: primary?.name || primary?.official_name || "Plaid Checking",
        mask: primary?.mask || "0000",
        type: "CHECKING",
        balance: primary?.balances.current ?? 0,
        plaidItemId: exchanged.data.item_id,
        plaidAccessEnc: accessToken,
      },
    });

    return jsonOk({
      bankAccount: {
        id: bank.id,
        mode: fromMode(bank.mode),
        institutionName: bank.institutionName,
        accountName: bank.accountName,
        mask: bank.mask,
        type: bank.type,
        balance: bank.balance.toString(),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
