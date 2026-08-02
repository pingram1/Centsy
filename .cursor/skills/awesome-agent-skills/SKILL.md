---
name: awesome-agent-skills
description: Browse and install curated agent skills from the VoltAgent awesome-agent-skills catalog. Use when the user asks for specialized dev skills (Stripe, Prisma, testing, security, MCP, etc.) or when you need an official team skill not already in the project.
license: MIT
metadata:
  source: https://github.com/VoltAgent/awesome-agent-skills
---

# Awesome Agent Skills Catalog

This project vendors the [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) catalog at:

`.cursor/skills-sources/awesome-agent-skills/README.md`

That repository is a curated index of 1,400+ skills from official teams (Anthropic, Stripe, Vercel, Supabase, Figma, etc.) and the community. Individual skills live in their own GitHub repositories — they are not copied into this repo by default.

## When to use this skill

- The user wants a capability covered by a known official or community skill.
- You need Stripe, testing, security, MCP, or framework-specific guidance beyond what is already installed.
- The user references the awesome-agent-skills list or asks to add a skill from it.

## How to find a skill

1. Read or search `.cursor/skills-sources/awesome-agent-skills/README.md`.
2. Prefer skills linked via [officialskills.sh](https://officialskills.sh) or direct GitHub paths.
3. Match the user's task to a skill name and description in the catalog.

## How to install a skill into this project

From the repo root:

```bash
./scripts/install-agent-skill.sh <owner/repo@skill-name>
```

Examples:

```bash
./scripts/install-agent-skill.sh stripe/ai@stripe-best-practices
./scripts/install-agent-skill.sh vercel-labs/agent-skills@web-design-guidelines
```

Installed skills are copied to `.cursor/skills/<skill-name>/` for Cursor.

## Refresh catalogs and design skills

```bash
./scripts/sync-skills.sh
```

This updates both skill source submodules and re-syncs all 67 design skills from [bergside/awesome-design-skills](https://github.com/bergside/awesome-design-skills).

## Security

Review third-party skills before installing. The catalog maintainers recommend [Synk Skill Security Scanner](https://github.com/snyk/agent-scan) and [Agent Trust Hub](https://ai.gendigital.com/agent-trust-hub).
