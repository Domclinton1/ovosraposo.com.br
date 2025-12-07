-- Remove address fields from profiles table since we now use delivery_addresses table
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS neighborhood,
DROP COLUMN IF EXISTS city;

-- Add index to delivery_addresses for faster queries
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_user_id ON public.delivery_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_is_primary ON public.delivery_addresses(is_primary);

-- Add index to orders for analytics
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_neighborhood ON public.orders(delivery_neighborhood);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);