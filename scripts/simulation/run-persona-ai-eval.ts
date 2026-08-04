/**
 * Ask each persona's sample questions to Centsy AI (OpenRouter + RAG)
 * and print answers for agent/human review.
 *
 * Prerequisites:
 *   - DATABASE_URL
 *   - OPENROUTER_API_KEY
 *   - Persona data seeded via generate-persona-data.ts
 *
 * Usage:
 *   npx tsx scripts/simulation/run-persona-ai-eval.ts --persona college_student
 *   npx tsx scripts/simulation/run-persona-ai-eval.ts --all
 */

import { PrismaClient } from "@prisma/client";
import {
  CENTSY_SYSTEM_PROMPT,
  retrieveUserContext,
} from "../../src/lib/centsy-ai/rag";
import { chatWithOpenRouter } from "../../src/lib/centsy-ai/openrouter";
import { getPersona, PERSONAS, type PersonaId } from "./personas";

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const idx = args.indexOf("--persona");
  const persona = idx >= 0 ? (args[idx + 1] as PersonaId) : undefined;
  return { all, persona };
}

async function evalPersona(id: PersonaId) {
  const persona = getPersona(id);
  const user = await prisma.user.findUnique({ where: { email: persona.email } });
  if (!user) {
    throw new Error(`Persona user not found. Run generate-persona-data first: ${id}`);
  }

  console.log(`\n=== ${persona.label} (${user.email}) ===\n`);

  for (const question of persona.sampleQuestions) {
    const rag = await retrieveUserContext(user.id, "personal");
    const { content, model } = await chatWithOpenRouter([
      { role: "system", content: CENTSY_SYSTEM_PROMPT },
      {
        role: "system",
        content: `LIVE DATABASE CONTEXT:\n${rag.contextText}`,
      },
      { role: "user", content: question },
    ]);

    console.log(`Q: ${question}`);
    console.log(`A (${model}): ${content}\n`);
  }
}

async function main() {
  const { all, persona } = parseArgs();
  const ids = all ? PERSONAS.map((p) => p.id) : persona ? [persona] : [];
  if (!ids.length) {
    console.log("Pass --all or --persona <id>");
    process.exit(1);
  }
  for (const id of ids) {
    await evalPersona(id);
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
