-- Drop the insecure admin policies
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

-- Create secure admin policies that actually check if user is admin
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
);