# Database access model (Supabase)

Centsy talks to Postgres **only through Prisma** (`DATABASE_URL`), with custom email/session auth. It does **not** use the Supabase Data API (PostgREST) or `auth.uid()` for app tables.

## PostgREST hardening (applied)

Per [Securing your API](https://supabase.com/docs/guides/api/securing-your-api) and [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security):

1. **Grants** — `REVOKE ALL … FROM anon, authenticated` on all Centsy tables so the publishable/anon key cannot reach them over the Data API.
2. **RLS** — `ENABLE ROW LEVEL SECURITY` on every `public` app table, plus **explicit deny** policies for `anon` / `authenticated` (`USING (false)`). That blocks PostgREST even if grants are re-added, and documents intent for the database linter.
3. **Default privileges** — revoked for `anon`/`authenticated` on future tables created by `postgres` in `public`.

Prisma continues to work because the connection role (`postgres`) owns the tables and has `BYPASSRLS`.

SQL mirror: `prisma/sql/enable_rls_lock_down_postgrest.sql`.

## What we intentionally did not do

- **No `auth.uid() = user_id` policies** — Centsy `User.id` values are Prisma cuids, not Supabase Auth UUIDs. Those policies would not match this auth model.
- **Did not disable the Data API globally** — optional extra step in the Dashboard if you never plan to use REST/GraphQL clients.

## If you later adopt Supabase Auth + client reads

Then: keep RLS, restore explicit `GRANT`s only for the roles you need, and add `TO authenticated` policies with ownership checks (`auth.uid()` mapped to your user id). Until then, server-side Prisma + revoked Data API grants is the correct lock-down.
