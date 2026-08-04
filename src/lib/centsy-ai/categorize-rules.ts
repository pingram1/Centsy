import { categoryLabel } from "../../../shared/format";
import type { TransactionCategory } from "../../../shared/types";

export type SuggestionPrecision = "high" | "medium" | "low";

export type CategorySuggestion = {
  /** Ledger category slug (matches TransactionCategory). */
  category: TransactionCategory;
  /** Human label for inbox / chat. */
  label: string;
  /** Secondary tags (e.g. delivery_services, grocery, subscription_candidate). */
  tags: string[];
  precision: SuggestionPrecision;
  confidence: number;
  reason: string;
  /** Shown when frequency suggests a named subscription. */
  subscriptionHint?: string;
  source: "user_memory" | "user_history" | "rules" | "fallback";
};

/** Normalize merchant strings for associative matching. */
export function normalizeMerchant(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/[^a-z0-9\s&']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FOOD_BRANDS =
  /\b(kfc|cava|dunkin'|dunkin|krispy kreme|blaze pizza|tropical smoothie|chipotle|mcdonald|starbucks|wendy|taco bell|burger king|popeyes|chick.?fil.?a|panera|subway|domino|pizza hut|papa john|five guys|shake shack|in.?n.?out|sweetgreen)\b/i;

const GROCERY_BRANDS =
  /\b(safeway|albertsons|food lion|whole foods|trader joe|kroger|lidl|aldi|publix|heb|h-?e-?b|wegmans|meijer|sprouts|fresh market)\b/i;

/** Explicit training override: Stop & Shop → Other (not Grocery). */
const OTHER_OVERRIDES = /\b(stop\s*&\s*shop|stop and shop)\b/i;

const ENTERTAINMENT_BRANDS =
  /\b(netflix|spotify|hulu|disney\+|disney plus|hbo|max|paramount\+|peacock|apple music|youtube premium|steam|playstation|xbox live|nintendo)\b/i;

const SOFTWARE_BRANDS =
  /\b(godaddy|openai|chatgpt|adobe|aws|amazon web|github|notion|slack|zoom|figma|microsoft|xbox|google workspace|dropbox|heroku|vercel|digitalocean|namecheap|squarespace|wix)\b/i;

const DELIVERY_SERVICES =
  /\b(uber\s*eats|doordash|grubhub|postmates|seamless|instacart|amazon\s*prime\s*delivery|temu)\b/i;

const TRANSPORT_BRANDS =
  /\b(uber(?!\s*eats)|lyft|citgo|shell|chevron|exxon|bp|mobil|speedway|parking|paybyphone|pay by phone|parkwhiz|spothero)\b/i;

const TRAVEL_BRANDS =
  /\b(airline|united airlines|delta|american airlines|jetblue|southwest|hotel|marriott|hilton|hyatt|airbnb|booking\.com|expedia)\b/i;

const HEALTHCARE_BRANDS =
  /\b(cvs|walgreens|rite aid|pharmacy|dental|hospital|urgent care|labcorp|quest diagnostics)\b/i;

const SHOPPING_BRANDS =
  /\b(amazon(?!\s*web)|target|walmart|best buy|costco|ebay|etsy|nike|apple store)\b/i;

const HOUSING_BRANDS = /\b(rent|mortgage|apartment|landlord|hoa)\b/i;

const UTILITIES_BRANDS =
  /\b(electric|gas company|water bill|comcast|verizon|at&t|t-mobile|internet|utility)\b/i;

const MARKETING_BRANDS =
  /\b(facebook ads|meta ads|google ads|mailchimp|hubspot|tiktok ads)\b/i;

const OFFICE_BRANDS =
  /\b(staples|office depot|fedex|ups store|usps|wework)\b/i;

/** Keyword fallback for unnamed eateries (e.g. "Food S"). */
const FOOD_KEYWORDS =
  /\b(food|dine|dining|buffet|sushi|smoothie|burger|chicken|pizza|taco|cafe|café|bakery|grill|kitchen|bistro|ramen|pho|bagel|donut|doughnut|bbq|barbecue|seafood|steakhouse|noodle|waffle|pancake|ice cream|yogurt|juice bar)\b/i;

const SUBSCRIPTIONISH =
  /\b(apple|google|amazon|microsoft|icloud|app store)\b/i;

export function baseSuggestion(
  category: TransactionCategory,
  partial: Omit<CategorySuggestion, "category" | "label"> & {
    label?: string;
  }
): CategorySuggestion {
  return {
    category,
    label: partial.label ?? categoryLabel(category),
    tags: partial.tags,
    precision: partial.precision,
    confidence: partial.confidence,
    reason: partial.reason,
    subscriptionHint: partial.subscriptionHint,
    source: partial.source,
  };
}

/**
 * Rule-pack prediction (training ground → Centsy AI synaptic priors).
 * Pure function — no DB.
 */
export function predictCategoryFromRules(
  merchant: string,
  amountAbs?: number
): CategorySuggestion {
  const m = normalizeMerchant(merchant);

  if (OTHER_OVERRIDES.test(m)) {
    return baseSuggestion("other", {
      tags: [],
      precision: "high",
      confidence: 0.92,
      reason: "Training override: Stop & Shop stays Other unless you retrain it.",
      source: "rules",
    });
  }

  if (DELIVERY_SERVICES.test(m)) {
    const isGoods = /\b(temu|amazon\s*prime\s*delivery)\b/i.test(m);
    return baseSuggestion(isGoods ? "shopping" : "food", {
      tags: ["delivery_services"],
      precision: "high",
      confidence: 0.95,
      reason:
        "Delivery marketplace — primary category plus Delivery Services tag.",
      source: "rules",
    });
  }

  // Grocery before food keywords so "Food Lion" is not captured as dining.
  if (GROCERY_BRANDS.test(m)) {
    return baseSuggestion("food", {
      label: "Grocery",
      tags: ["grocery"],
      precision: "high",
      confidence: 0.9,
      reason: "Grocery banner — distinct from Food & Dining restaurants.",
      source: "rules",
    });
  }

  if (FOOD_BRANDS.test(m)) {
    return baseSuggestion("food", {
      tags: [],
      precision: "high",
      confidence: 0.9,
      reason: "Known restaurant / QSR / café brand.",
      source: "rules",
    });
  }

  if (FOOD_KEYWORDS.test(m)) {
    return baseSuggestion("food", {
      tags: [],
      precision: "high",
      confidence: 0.85,
      reason: "Eating-related keywords without a commercial brand name.",
      source: "rules",
    });
  }

  if (ENTERTAINMENT_BRANDS.test(m)) {
    return baseSuggestion("entertainment", {
      tags: ["subscription_candidate"],
      precision: "high",
      confidence: 0.93,
      reason: "Streaming / media brand.",
      subscriptionHint:
        "Looks like a recurring media charge — want to name this subscription?",
      source: "rules",
    });
  }

  if (SOFTWARE_BRANDS.test(m)) {
    return baseSuggestion("software", {
      tags: ["subscription_candidate"],
      precision: "high",
      confidence: 0.9,
      reason: "SaaS / domains / AI / platform tooling.",
      source: "rules",
    });
  }

  if (TRANSPORT_BRANDS.test(m)) {
    return baseSuggestion("transport", {
      tags: [],
      precision: "high",
      confidence: 0.88,
      reason: "Fuel, rideshare, or parking merchant.",
      source: "rules",
    });
  }

  if (TRAVEL_BRANDS.test(m)) {
    return baseSuggestion("travel", {
      tags: [],
      precision: "high",
      confidence: 0.85,
      reason: "Travel / lodging merchant.",
      source: "rules",
    });
  }

  if (HEALTHCARE_BRANDS.test(m)) {
    return baseSuggestion("healthcare", {
      tags: [],
      precision: "medium",
      confidence: 0.8,
      reason: "Pharmacy / clinical merchant.",
      source: "rules",
    });
  }

  if (HOUSING_BRANDS.test(m)) {
    return baseSuggestion("housing", {
      tags: [],
      precision: "medium",
      confidence: 0.75,
      reason: "Housing-related merchant text.",
      source: "rules",
    });
  }

  if (UTILITIES_BRANDS.test(m)) {
    return baseSuggestion("utilities", {
      tags: [],
      precision: "medium",
      confidence: 0.75,
      reason: "Utility / telecom merchant.",
      source: "rules",
    });
  }

  if (MARKETING_BRANDS.test(m)) {
    return baseSuggestion("marketing", {
      tags: [],
      precision: "high",
      confidence: 0.85,
      reason: "Ads / marketing SaaS.",
      source: "rules",
    });
  }

  if (OFFICE_BRANDS.test(m)) {
    return baseSuggestion("office", {
      tags: [],
      precision: "medium",
      confidence: 0.8,
      reason: "Office / shipping merchant.",
      source: "rules",
    });
  }

  if (SHOPPING_BRANDS.test(m)) {
    return baseSuggestion("shopping", {
      tags: [],
      precision: "medium",
      confidence: 0.7,
      reason: "General retail merchant.",
      source: "rules",
    });
  }

  if (SUBSCRIPTIONISH.test(m)) {
    return baseSuggestion("other", {
      tags: ["subscription_candidate"],
      precision: "low",
      confidence: 0.55,
      reason:
        "Ambiguous platform charge — keep as Other until you name what it is.",
      subscriptionHint:
        "If this repeats, I can track it as a named subscription (e.g. iCloud, App Store games) instead of a one-off Apple purchase.",
      source: "rules",
    });
  }

  const noisy = amountAbs != null && amountAbs >= 200;
  return baseSuggestion("other", {
    tags: [],
    precision: noisy ? "low" : "medium",
    confidence: 0.35,
    reason: noisy
      ? "Noisy / unfamiliar merchant with a large amount — needs your feedback."
      : "No strong association yet — defaulting to Other.",
    source: "fallback",
  });
}
