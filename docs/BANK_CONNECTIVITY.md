# Bank connectivity — execution plan

Goal: connected banks power **Home**, not a Profile trophy. Ledger stays the system of record; Plaid is the intake stream.

## Workspace isolation (hard rule)
Personal and Business are separate realms that share UX patterns, not data.
- `BankAccount.mode` is required — a personal checking account never appears in Business.
- Sync, inbox, cash pulse, and Accept all filter by the active workspace.
- The same Plaid Item cannot be linked in both workspaces (disconnect one side first).
- Business profile stores `businessEin` for tax/export metadata.

## Product north star
> Centsy finishes your week—bank charges sorted, Personal vs Business kept clean, books that match.

## Free (build now)
| # | Feature | Surface |
|---|---------|---------|
| 1 | Sync Plaid transactions → `BankTransaction` | `POST /api/plaid/sync` |
| 2 | Bank inbox (triage new charges) | Home |
| 3 | Accept → create ledger `Transaction` + link + reconcile | Inbox actions |
| 4 | Ignore / assign Personal vs Business | Inbox actions |
| 5 | Cash pulse diagram (balances + week match %) | Home interactive |
| 6 | Pull-to-refresh syncs banks | Home |

## Pro (scaffold / teaser only — do not fully ship)
| Feature | Why Pro |
|---------|---------|
| AI merchant categorization & auto workspace | Model cost + accuracy |
| Receipt ↔ bank auto-match | Vision + matching pipeline |
| Cash runway / “can I afford this?” | Forecasting + alerts |
| Anomaly / duplicate-charge alerts | Monitoring infra |
| Multi-account cashflow diagram (all accounts) | Advanced analytics |
| Accountant-ready unmatched export | Pro seat workflow |

Pro teasers appear on Home with a clear **Pro** chip linking to Plan & billing.

## Data flow
```
Plaid Item → sync → BankTransaction (ignored=false, unmatched)
                 → Home inbox
                 → Accept → Transaction + bankTransactionId + reconciled
                 → Cash pulse: matched / total this week
```

## Implementation order
1. Schema: `BankAccount.lastSyncedAt`, `BankTransaction.ignored`
2. Sync + inbox APIs
3. Home Cash pulse + Inbox UI
4. Pro teaser cards (gated by `user.plan !== "PRO"`)
