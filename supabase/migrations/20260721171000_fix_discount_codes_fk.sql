-- Fix foreign key constraint on public.orders(discount_code) to allow deleting and updating discount codes
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_discount_code_fkey;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_discount_code_fkey
  FOREIGN KEY (discount_code) 
  REFERENCES public.discount_codes(code)
  ON UPDATE CASCADE
  ON DELETE SET NULL;
