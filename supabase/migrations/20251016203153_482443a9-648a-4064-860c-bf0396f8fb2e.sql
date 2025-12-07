-- Remover constraint antiga
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Adicionar nova constraint com pending_payment e outros status necessários
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status = ANY (ARRAY[
  'new'::text, 
  'pending_payment'::text,
  'in_transit'::text, 
  'delivered'::text,
  'cancelled'::text
]));