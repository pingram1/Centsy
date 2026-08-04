/**
 * Persona definitions for autonomous sub-agent simulation runs.
 * Each persona describes income/spend patterns used by generators + AI eval prompts.
 */

export type PersonaId =
  | "single_mom"
  | "millionaire_ceo"
  | "college_student"
  | "middle_class_couple";

export interface PersonaDefinition {
  id: PersonaId;
  label: string;
  email: string;
  fullName: string;
  password: string;
  aiProfile: string;
  memories: { key: string; value: string }[];
  /** Rough monthly personal income */
  personalIncome: number;
  /** Rough monthly business income (0 if none) */
  businessIncome: number;
  personalCategories: {
    category: string;
    avgAmount: number;
    frequencyPerMonth: number;
    merchants: string[];
  }[];
  businessCategories: {
    category: string;
    avgAmount: number;
    frequencyPerMonth: number;
    merchants: string[];
  }[];
  sampleQuestions: string[];
}

export const PERSONAS: PersonaDefinition[] = [
  {
    id: "single_mom",
    label: "Single mom with two kids",
    email: "sim.singlemom@centsy.test",
    fullName: "Maya Torres",
    password: "sim-password-mom",
    aiProfile:
      "Single mom of two kids (ages 6 and 9). Tight grocery and childcare budget. Values education savings.",
    memories: [
      { key: "family", value: "Has two kids" },
      { key: "priority", value: "Childcare and groceries first" },
    ],
    personalIncome: 4200,
    businessIncome: 0,
    personalCategories: [
      {
        category: "food",
        avgAmount: 95,
        frequencyPerMonth: 12,
        merchants: ["Costco", "Kroger", "McDonald's"],
      },
      {
        category: "housing",
        avgAmount: 1450,
        frequencyPerMonth: 1,
        merchants: ["Landlord LLC"],
      },
      {
        category: "healthcare",
        avgAmount: 40,
        frequencyPerMonth: 2,
        merchants: ["CVS", "Urgent Care"],
      },
      {
        category: "entertainment",
        avgAmount: 18,
        frequencyPerMonth: 3,
        merchants: ["Netflix", "Disney+"],
      },
      {
        category: "transport",
        avgAmount: 55,
        frequencyPerMonth: 4,
        merchants: ["Shell", "Uber"],
      },
    ],
    businessCategories: [],
    sampleQuestions: [
      "How much did I spend on groceries this month?",
      "Am I overspending on takeout versus cooking?",
      "Where can I free up $100 for a kids' savings account?",
    ],
  },
  {
    id: "millionaire_ceo",
    label: "Millionaire CEO (personal + business)",
    email: "sim.ceo@centsy.test",
    fullName: "Jordan Blake",
    password: "sim-password-ceo",
    aiProfile:
      "CEO tracking personal lifestyle spend separately from operating expenses. Focused on tax-aware categorization.",
    memories: [
      { key: "role", value: "Executive / founder" },
      { key: "goal", value: "Keep personal and business ledgers clean" },
    ],
    personalIncome: 35000,
    businessIncome: 180000,
    personalCategories: [
      {
        category: "travel",
        avgAmount: 2200,
        frequencyPerMonth: 2,
        merchants: ["Delta", "Four Seasons"],
      },
      {
        category: "entertainment",
        avgAmount: 400,
        frequencyPerMonth: 4,
        merchants: ["Concerts", "Private Dining"],
      },
      {
        category: "shopping",
        avgAmount: 800,
        frequencyPerMonth: 3,
        merchants: ["Nordstrom", "Apple"],
      },
    ],
    businessCategories: [
      {
        category: "software",
        avgAmount: 1200,
        frequencyPerMonth: 6,
        merchants: ["AWS", "Salesforce", "Notion"],
      },
      {
        category: "marketing",
        avgAmount: 8500,
        frequencyPerMonth: 4,
        merchants: ["Meta Ads", "Google Ads"],
      },
      {
        category: "travel",
        avgAmount: 1600,
        frequencyPerMonth: 3,
        merchants: ["United", "Uber Business"],
      },
      {
        category: "office",
        avgAmount: 4500,
        frequencyPerMonth: 1,
        merchants: ["WeWork"],
      },
    ],
    sampleQuestions: [
      "What percent of business opex is software this month?",
      "Did any personal travel get miscategorized as business?",
      "Summarize my Personal vs Business spend this month.",
    ],
  },
  {
    id: "college_student",
    label: "College student learning budgeting",
    email: "sim.student@centsy.test",
    fullName: "Sam Okonkwo",
    password: "sim-password-student",
    aiProfile:
      "College student with part-time income. Learning to avoid impulsive food delivery and track textbooks.",
    memories: [
      { key: "life_stage", value: "College student" },
      { key: "goal", value: "Build an emergency fund of $1000" },
    ],
    personalIncome: 1400,
    businessIncome: 0,
    personalCategories: [
      {
        category: "food",
        avgAmount: 22,
        frequencyPerMonth: 20,
        merchants: ["Chipotle", "DoorDash", "Campus Cafe"],
      },
      {
        category: "entertainment",
        avgAmount: 15,
        frequencyPerMonth: 4,
        merchants: ["Spotify", "Steam"],
      },
      {
        category: "shopping",
        avgAmount: 60,
        frequencyPerMonth: 2,
        merchants: ["Amazon", "Bookstore"],
      },
      {
        category: "transport",
        avgAmount: 12,
        frequencyPerMonth: 8,
        merchants: ["Bus Pass", "Lyft"],
      },
    ],
    businessCategories: [],
    sampleQuestions: [
      "How much did I spend on DoorDash this month?",
      "Am I living within my part-time income?",
      "What's one habit change that would help me save $50/week?",
    ],
  },
  {
    id: "middle_class_couple",
    label: "Two-parent middle-class couple with a dog",
    email: "sim.couple@centsy.test",
    fullName: "Chris & Avery Nguyen",
    password: "sim-password-couple",
    aiProfile:
      "Dual-income couple, no kids, one dog (Milo). Balancing mortgage, pet care, and date nights.",
    memories: [
      { key: "pets", value: "Has a dog named Milo" },
      { key: "household", value: "Two-adult household, no kids" },
    ],
    personalIncome: 9200,
    businessIncome: 0,
    personalCategories: [
      {
        category: "housing",
        avgAmount: 2400,
        frequencyPerMonth: 1,
        merchants: ["Mortgage Servicer"],
      },
      {
        category: "food",
        avgAmount: 110,
        frequencyPerMonth: 10,
        merchants: ["Whole Foods", "Trader Joe's", "Local Bistro"],
      },
      {
        category: "healthcare",
        avgAmount: 75,
        frequencyPerMonth: 2,
        merchants: ["Vet Clinic", "Petco"],
      },
      {
        category: "utilities",
        avgAmount: 220,
        frequencyPerMonth: 1,
        merchants: ["Electric Co", "Internet"],
      },
      {
        category: "entertainment",
        avgAmount: 90,
        frequencyPerMonth: 3,
        merchants: ["Movie Theater", "Concert"],
      },
    ],
    businessCategories: [],
    sampleQuestions: [
      "How much are we spending on the dog this month?",
      "What's our food spend versus last month?",
      "Can we afford to invest $500 this month after essentials?",
    ],
  },
];

export function getPersona(id: PersonaId) {
  const persona = PERSONAS.find((p) => p.id === id);
  if (!persona) throw new Error(`Unknown persona: ${id}`);
  return persona;
}
