-- Migration: Add min_order_value column to discount_codes table
ALTER TABLE public.discount_codes 
ADD COLUMN IF NOT EXISTS min_order_value NUMERIC(12,2) DEFAULT NULL;

COMMENT ON COLUMN public.discount_codes.min_order_value IS 'Giá trị đơn hàng tối thiểu để được áp dụng mã giảm giá (NULL nếu không giới hạn)';
