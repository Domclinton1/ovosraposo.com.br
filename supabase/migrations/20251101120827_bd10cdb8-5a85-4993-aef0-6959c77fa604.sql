-- Remove any existing UPDATE policies for regular users on orders
DROP POLICY IF EXISTS "users_update_own_orders" ON public.orders;

-- Create restricted policy: users can only update delivery information, not critical fields
CREATE POLICY "users_update_delivery_info_only" 
ON public.orders 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  -- Ensure critical fields cannot be changed by comparing with existing values
  status = (SELECT status FROM orders o WHERE o.id = orders.id) AND
  total = (SELECT total FROM orders o WHERE o.id = orders.id) AND
  mercado_pago_payment_id = (SELECT mercado_pago_payment_id FROM orders o WHERE o.id = orders.id) AND
  payment_method = (SELECT payment_method FROM orders o WHERE o.id = orders.id) AND
  items::text = (SELECT items::text FROM orders o WHERE o.id = orders.id)
);

-- Staff can still update all fields (this policy already exists: staff_update_orders_only)
-- This ensures only staff roles can modify status, payment info, etc.