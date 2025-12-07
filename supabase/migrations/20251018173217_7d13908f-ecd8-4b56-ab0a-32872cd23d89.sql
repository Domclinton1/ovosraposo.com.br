-- Atualizar pedidos sem payment_method para 'cash' (dinheiro)
UPDATE public.orders 
SET payment_method = 'cash' 
WHERE payment_method IS NULL;