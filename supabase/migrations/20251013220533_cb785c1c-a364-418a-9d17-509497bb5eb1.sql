-- ============================================
-- CRITICAL FIX: Bloquear acesso público às tabelas
-- ============================================

-- Revogar acesso público de todas as tabelas sensíveis
REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public.orders FROM anon, authenticated;
REVOKE ALL ON public.delivery_addresses FROM anon, authenticated;
REVOKE ALL ON public.user_roles FROM anon, authenticated;
REVOKE ALL ON public.order_status_history FROM anon, authenticated;

-- Re-conceder apenas SELECT/INSERT/UPDATE baseado nas políticas RLS
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_addresses TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT ON public.order_status_history TO authenticated;

-- Garantir que APENAS authenticated pode acessar (nenhum acesso anon)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_addresses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history FORCE ROW LEVEL SECURITY;
