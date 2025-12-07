-- Security Fix: Restrict direct order access for non-admin staff
-- Staff should only access orders through get_masked_orders() function

-- Drop the existing staff_update_orders policy
DROP POLICY IF EXISTS staff_update_orders ON public.orders;

-- Create separate policies for different operations
-- Non-admin staff can only SELECT through get_masked_orders function (enforced at app level)
-- Only admins can SELECT directly
CREATE POLICY "admins_select_orders"
ON public.orders
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Non-admin staff can UPDATE orders (but not SELECT them directly)
CREATE POLICY "staff_update_orders_only"
ON public.orders
FOR UPDATE
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));