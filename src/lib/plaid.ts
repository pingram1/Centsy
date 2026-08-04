import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";

export function getPlaidClient() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = process.env.PLAID_ENV || "sandbox";
  if (!clientId || !secret) {
    throw new Error(
      "PLAID_CLIENT_ID and PLAID_SECRET are required. Add them to .env.local."
    );
  }
  return {
    client: new PlaidApi(
      new Configuration({
        basePath:
          env === "production"
            ? PlaidEnvironments.production
            : env === "development"
              ? PlaidEnvironments.development
              : PlaidEnvironments.sandbox,
        baseOptions: {
          headers: {
            "PLAID-CLIENT-ID": clientId,
            "PLAID-SECRET": secret,
          },
        },
      })
    ),
    env,
    Products,
    CountryCode,
  };
}
