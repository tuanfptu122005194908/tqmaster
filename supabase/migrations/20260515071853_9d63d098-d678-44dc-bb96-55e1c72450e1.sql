
-- 1. DROP client-side INSERT policies (force creation via edge function w/ service role)
DROP POLICY IF EXISTS users_create_own_orders ON public.orders;
DROP POLICY IF EXISTS users_create_own_order_items ON public.order_items;

-- 2. Defense-in-depth validation triggers
CREATE OR REPLACE FUNCTION public.validate_order_amounts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.original_amount IS NULL OR NEW.original_amount < 0 THEN
    RAISE EXCEPTION 'original_amount must be >= 0';
  END IF;
  IF NEW.discount_amount IS NULL OR NEW.discount_amount < 0 THEN
    RAISE EXCEPTION 'discount_amount must be >= 0';
  END IF;
  IF NEW.discount_amount > NEW.original_amount THEN
    RAISE EXCEPTION 'discount_amount cannot exceed original_amount';
  END IF;
  IF NEW.final_amount IS NULL OR NEW.final_amount <= 0 THEN
    RAISE EXCEPTION 'final_amount must be > 0';
  END IF;
  IF NEW.final_amount <> (NEW.original_amount - NEW.discount_amount) THEN
    RAISE EXCEPTION 'final_amount mismatch (got %, expected %)',
      NEW.final_amount, (NEW.original_amount - NEW.discount_amount);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_order_amounts ON public.orders;
CREATE TRIGGER trg_validate_order_amounts
  BEFORE INSERT OR UPDATE OF original_amount, discount_amount, final_amount
  ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_amounts();

CREATE OR REPLACE FUNCTION public.validate_order_item_price()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  db_price numeric;
BEGIN
  IF NEW.price IS NULL OR NEW.price < 0 THEN
    RAISE EXCEPTION 'order_items.price must be >= 0';
  END IF;
  SELECT price INTO db_price FROM public.subjects WHERE id = NEW.subject_id;
  IF db_price IS NULL THEN
    RAISE EXCEPTION 'subject % not found', NEW.subject_id;
  END IF;
  IF NEW.price <> db_price THEN
    RAISE EXCEPTION 'order_items.price (%) does not match subjects.price (%)', NEW.price, db_price;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_order_item_price ON public.order_items;
CREATE TRIGGER trg_validate_order_item_price
  BEFORE INSERT OR UPDATE OF price, subject_id
  ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_item_price();
