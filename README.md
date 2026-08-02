# Centsy 🪙

Centsy is a modern, AI-powered finance tracker designed to eliminate manual data entry and provide actionable financial coaching. Built with a strict dual-mode architecture, it allows users to seamlessly manage both personal and business finances under a single account. By leveraging Vision AI to parse paper receipts, POS screens, and invoices, Centsy automatically categorizes spending and delivers proactive insights to help users optimize their financial health.

## Core Features
- **Dual-Mode Architecture:** Seamlessly toggle between isolated Personal and Business environments.
- **AI-Powered Image Parsing:** Upload any receipt or invoice to automatically extract and categorize transactions.
- **Proactive Insights:** Actionable coaching to reduce impulsive spending and encourage wealth-building.
- **Granular Mileage Tracking:** Dedicated logging for gas and trip expenses.

## Agent Skills

This project includes skills from two curated registries:

| Registry | Source | What's included |
|----------|--------|-----------------|
| **Design skills** (67) | [bergside/awesome-design-skills](https://github.com/bergside/awesome-design-skills) | UI design system skills in `.cursor/skills/` (clean, minimal, glassmorphism, etc.) |
| **Agent skills catalog** | [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | Browsable index of 1,400+ official and community skills |

Both registries are vendored as git submodules under `.cursor/skills-sources/`.

### Sync design skills

```bash
./scripts/sync-skills.sh
```

Updates submodules and copies the latest design `SKILL.md` files into `.cursor/skills/`.

### Install a skill from the agent catalog

Browse `.cursor/skills-sources/awesome-agent-skills/README.md`, then:

```bash
./scripts/install-agent-skill.sh stripe/ai@stripe-best-practices
```

Installed skills are placed in `.cursor/skills/<name>/` for Cursor.

