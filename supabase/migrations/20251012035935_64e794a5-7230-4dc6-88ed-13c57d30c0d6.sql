-- Remove a política que permite todos os staff verem todos os pedidos
DROP POLICY IF EXISTS "Staff can view all orders" ON public.orders;

-- Criar política específica para staff ver apenas informações limitadas dos pedidos
CREATE POLICY "Staff can view limited order info"
ON public.orders
FOR SELECT
USING (
  is_staff(auth.uid()) 
  AND NOT has_role(auth.uid(), 'admin'::app_role)
);

-- Manter política para admins verem tudo
-- (já existe: "Admins can view all orders")

-- Adicionar política para clientes verem o histórico de status dos seus próprios pedidos
CREATE POLICY "Users can view their own order status history"
ON public.order_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_status_history.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Criar view para staff (não-admin) que mascara dados sensíveis
CREATE OR REPLACE VIEW public.orders_staff_view AS
SELECT 
  id,
  user_id,
  created_at,
  updated_at,
  status,
  priority,
  total,
  items,
  delivery_city,
  delivery_neighborhood,
  -- Mascarar dados sensíveis
  CONCAT(LEFT(customer_name, 3), '***') as customer_name,
  CONCAT('***', RIGHT(phone, 4)) as phone,
  CONCAT(LEFT(delivery_address, 10), '***') as delivery_address,
  assigned_to,
  notes,
  whatsapp_message_id
FROM public.orders;

-- Permitir staff acessar a view
GRANT SELECT ON public.orders_staff_view TO authenticated;