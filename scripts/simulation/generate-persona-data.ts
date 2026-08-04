/**
 * Seed a persona user + synthetic transactions into the live database.
 *
 * Usage:
 *   npx tsx scripts/simulation/generate-persona-data.ts --persona single_mom
 *   npx tsx scripts/simulation/generate-persona-data.ts --all
 */

import { PrismaClient, type TransactionCategory } from "@prisma/client";
import bcrypt from "bcryptjs";
import { subDays } from "date-fns";
import { getPersona, PERSONAS, type PersonaDefinition } from "./personas";

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const idx = args.indexOf("--persona");
  const persona = idx >= 0 ? args[idx + 1] : undefined;
  return { all, persona };
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitter(amount: number) {
  const factor = 0.75 + Math.random() * 0.5;
  return Math.round(amount * factor * 100) / 100;
}

function toCategory(raw: string): TransactionCategory {
  return raw.toUpperCase() as TransactionCategory;
}

async function upsertPersona(persona: PersonaDefinition) {
  const passwordHash = await bcrypt.hash(persona.password, 12);

  const user = await prisma.user.upsert({
    where: { email: persona.email },
    create: {
      email: persona.email,
      fullName: persona.fullName,
      passwordHash,
      aiProfile: persona.aiProfile,
    },
    update: {
      fullName: persona.fullName,
      aiProfile: persona.aiProfile,
      passwordHash,
    },
  });

  const existingThread = await prisma.chatThread.findFirst({
    where: { userId: user.id },
  });
  if (!existingThread) {
    await prisma.chatThread.create({
      data: { userId: user.id, title: "Centsy AI" },
    });
  }

  for (const memory of persona.memories) {
    await prisma.aiMemory.upsert({
      where: { userId_key: { userId: user.id, key: memory.key } },
      create: {
        userId: user.id,
        key: memory.key,
        value: memory.value,
        source: "simulation",
      },
      update: { value: memory.value, source: "simulation" },
    });
  }

  // Clear prior sim transactions for idempotent re-runs
  await prisma.receipt.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.mileageLog.deleteMany({ where: { userId: user.id } });

  // Income deposits
  if (persona.personalIncome > 0) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        mode: "PERSONAL",
        merchant: "Payroll",
        amount: persona.personalIncome,
        date: subDays(new Date(), 3),
        category: "INCOME",
        type: "INCOME",
        notes: "Simulation income",
      },
    });
  }
  if (persona.businessIncome > 0) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        mode: "BUSINESS",
        merchant: "Client Retainers",
        amount: persona.businessIncome,
        date: subDays(new Date(), 5),
        category: "INCOME",
        type: "INCOME",
        notes: "Simulation business income",
      },
    });
  }

  async function seedCats(
    mode: "PERSONAL" | "BUSINESS",
    cats: PersonaDefinition["personalCategories"]
  ) {
    for (const cat of cats) {
      for (let i = 0; i < cat.frequencyPerMonth; i++) {
        await prisma.transaction.create({
          data: {
            userId: user.id,
            mode,
            merchant: pick(cat.merchants),
            amount: jitter(cat.avgAmount),
            date: subDays(new Date(), Math.floor(Math.random() * 28)),
            category: toCategory(cat.category),
            type: "EXPENSE",
            notes: `sim:${persona.id}`,
          },
        });
      }
    }
  }

  await seedCats("PERSONAL", persona.personalCategories);
  await seedCats("BUSINESS", persona.businessCategories);

  const count = await prisma.transaction.count({ where: { userId: user.id } });
  console.log(`✓ ${persona.label}: user=${user.id} transactions=${count}`);
  return user;
}

async function main() {
  const { all, persona } = parseArgs();
  if (!all && !persona) {
    console.log("Pass --all or --persona <id>");
    console.log(
      "Ids:",
      PERSONAS.map((p) => p.id).join(", ")
    );
    process.exit(1);
  }

  const list = all
    ? PERSONAS
    : [getPersona(persona as Parameters<typeof getPersona>[0])];

  for (const p of list) {
    await upsertPersona(p);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
