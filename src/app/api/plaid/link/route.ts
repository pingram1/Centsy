import { requireUser } from "@/lib/auth";
import { getPlaidClient } from "@/lib/plaid";
import { jsonError, jsonOk } from "@/lib/api-utils";

/** Create a Plaid Link token for Profile → Connected banks. */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const { client, Products, CountryCode } = getPlaidClient();
    const response = await client.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "Centsy",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });
    return jsonOk({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
      env: process.env.PLAID_ENV || "sandbox",
    });
  } catch (error) {
    return jsonError(error);
  }
}
