-- Read-only diagnostics. No tables, roles, grants or policies are modified.
select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('roles_usuario', 'estudiantes', 'matriculas', 'cursos', 'consolidados')
order by tablename, policyname;

select c.relname as table_name, c.relrowsecurity as rls_enabled,
  has_schema_privilege('authenticated', 'public', 'USAGE') as schema_usage,
  has_table_privilege('authenticated', c.oid, 'SELECT') as can_select,
  has_table_privilege('authenticated', c.oid, 'INSERT') as can_insert,
  has_table_privilege('authenticated', c.oid, 'UPDATE') as can_update
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('roles_usuario', 'estudiantes', 'matriculas', 'cursos', 'consolidados');

-- onConflict: matricula_id requires a matching unique index or constraint.
select indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename = 'consolidados';

-- Verify generated formulas, null handling and the ID default without reading grades.
select column_name, data_type, is_nullable, column_default, is_generated, generation_expression
from information_schema.columns
where table_schema = 'public' and table_name = 'consolidados'
order by ordinal_position;
