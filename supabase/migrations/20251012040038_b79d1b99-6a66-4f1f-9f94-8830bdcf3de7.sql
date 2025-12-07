-- Remover a política de staff que não funciona corretamente
DROP POLICY IF EXISTS "Staff can view limited order info" ON public.orders;

-- Staff não-admin não terá acesso direto à tabela orders
-- Apenas admins terão acesso completo através da política existente "Admins can view all orders"

-- Criar uma função que staff pode usar para ver pedidos mascarados
CREATE OR REPLACE FUNCTION public.get_masked_orders()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  status text,
  priority text,
  total numeric,
  items jsonb,
  delivery_city text,
  delivery_neighborhood text,
  customer_name text,
  phone text,
  delivery_address text,
  assigned_to uuid,
  notes text,
  whatsapp_message_id text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.user_id,
    o.created_at,
    o.updated_at,
    o.status,
    o.priority,
    o.total,
    o.items,
    o.delivery_city,
    o.delivery_neighborhood,
    -- Mascarar dados sensíveis apenas para staff não-admin
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN o.customer_name
      ELSE CONCAT(LEFT(o.customer_name, 3), '***')
    END as customer_name,
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN o.phone
      ELSE CONCAT('***', RIGHT(o.phone, 4))
    END as phone,
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN o.delivery_address
      ELSE CONCAT(LEFT(o.delivery_address, 10), '***')
    END as delivery_address,
    o.assigned_to,
    o.notes,
    o.whatsapp_message_id
  FROM public.orders o
  WHERE is_staff(auth.uid());
$$;