-- Enable RLS + lock down PostgREST for Centsy tables.
-- Applied remotely via Supabase MCP as: enable_rls_lock_down_postgrest
--
-- Why this shape (not auth.uid() policies):
-- Centsy uses Prisma + custom session auth over DATABASE_URL.
-- PostgREST anon/authenticated must not read/write these tables.
-- See: https://supabase.com/docs/guides/api/securing-your-api
--      https://supabase.com/docs/guides/database/postgres/row-level-security

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BankAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BankTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Receipt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MileageLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChatThread" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AiMemory" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."User" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Session" FROM anon, authenticated;
REVOKE ALL ON TABLE public."BankAccount" FROM anon, authenticated;
REVOKE ALL ON TABLE public."BankTransaction" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Transaction" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Receipt" FROM anon, authenticated;
REVOKE ALL ON TABLE public."MileageLog" FROM anon, authenticated;
REVOKE ALL ON TABLE public."ChatThread" FROM anon, authenticated;
REVOKE ALL ON TABLE public."ChatMessage" FROM anon, authenticated;
REVOKE ALL ON TABLE public."AiMemory" FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

-- Explicit deny policies (PostgREST roles)
DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User','Session','BankAccount','BankTransaction','Transaction',
    'Receipt','MileageLog','ChatThread','ChatMessage','AiMemory'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO anon USING (false) WITH CHECK (false)',
      'deny_anon_' || t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (false) WITH CHECK (false)',
      'deny_authenticated_' || t, t
    );
  END LOOP;
END $$;
