import { requireUser } from "@/lib/auth";
import { appBaseUrl, getStripe } from "@/lib/stripe";
import { jsonError, jsonOk } from "@/lib/api-utils";

/** Stripe Customer Portal for Pro plan management. */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    if (!user.stripeCustomerId) {
      return jsonError(new Error("No Stripe customer on file. Upgrade first."), 400);
    }
    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appBaseUrl()}/settings`,
    });
    return jsonOk({ url: portal.url });
  } catch (error) {
    return jsonError(error);
  }
}
