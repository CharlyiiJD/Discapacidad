-- Read-only diagnostics. Run in Supabase SQL Editor; no permissions are changed.
select
  has_schema_privilege('authenticated', 'public', 'USAGE') as authenticated_schema_usage,
  has_table_privilege('authenticated', 'public.cursos', 'SELECT') as authenticated_courses_select,
  has_column_privilege('authenticated', 'public.cursos', 'carrera', 'SELECT') as authenticated_career_select;

select relname as table_name, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_class
where oid = 'public.cursos'::regclass;

select policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'cursos';
