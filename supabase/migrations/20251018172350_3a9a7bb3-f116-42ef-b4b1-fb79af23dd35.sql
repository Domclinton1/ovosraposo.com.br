-- Adicionar coluna payment_method na tabela orders
ALTER TABLE public.orders 
ADD COLUMN payment_method TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.orders.payment_method IS 'Forma de pagamento: pix, credit_card, debit_card, cash';