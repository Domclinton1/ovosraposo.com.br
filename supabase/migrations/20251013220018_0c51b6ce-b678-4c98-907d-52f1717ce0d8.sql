-- ============================================
-- MIGRATION: Fortalecer Segurança RLS
-- Data: 2025-10-13
-- Descrição: Corrigir vulnerabilidades de segurança em RLS policies
-- ============================================

-- 1. Remover políticas antigas que podem ter vulnerabilidades
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

-- 2. Criar políticas mais seguras para orders
-- Usuários podem ver apenas seus próprios pedidos (verificação rigorosa)
CREATE POLICY "users_select_own_orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Usuários podem inserir pedidos apenas para si mesmos
CREATE POLICY "users_insert_own_orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- Apenas admins podem ver todos os pedidos
CREATE POLICY "admins_select_all_orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admins e staff podem atualizar pedidos
CREATE POLICY "staff_update_orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  public.is_staff(auth.uid())
)
WITH CHECK (
  public.is_staff(auth.uid())
);

-- Apenas admins podem deletar pedidos
CREATE POLICY "admins_delete_orders"
ON public.orders
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Fortalecer políticas de order_status_history
DROP POLICY IF EXISTS "Users can view their own order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Staff can view status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Staff can insert status history" ON public.order_status_history;

-- Usuários podem ver histórico apenas de seus próprios pedidos (sem subconsulta vulnerável)
CREATE POLICY "users_select_own_order_history"
ON public.order_status_history
FOR SELECT
TO authenticated
USING (
  changed_by = auth.uid() OR
  order_id IN (
    SELECT id FROM public.orders WHERE user_id = auth.uid()
  )
);

-- Staff pode ver todo o histórico
CREATE POLICY "staff_select_all_history"
ON public.order_status_history
FOR SELECT
TO authenticated
USING (
  public.is_staff(auth.uid())
);

-- Apenas staff pode inserir no histórico
CREATE POLICY "staff_insert_history"
ON public.order_status_history
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_staff(auth.uid()) AND
  changed_by = auth.uid()
);

-- 4. Fortalecer políticas de profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "users_select_own_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Usuários podem inserir apenas seu próprio perfil
CREATE POLICY "users_insert_own_profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "users_update_own_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- Admins podem ver todos os perfis
CREATE POLICY "admins_select_all_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- 5. Adicionar índices para melhorar performance de queries RLS
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_user_id ON public.delivery_addresses(user_id);

-- 6. Adicionar comentários de segurança
COMMENT ON TABLE public.orders IS 'Contains sensitive customer data - protected by RLS';
COMMENT ON TABLE public.profiles IS 'Contains PII - protected by RLS';
COMMENT ON TABLE public.order_status_history IS 'Contains business operations data - protected by RLS';

-- 7. Garantir que RLS está habilitado em todas as tabelas sensíveis
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;
