CREATE OR REPLACE FUNCTION public.admin_confirm_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Chỉ cho phép admin thực hiện xác thực
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Chỉ admin mới có quyền xác thực tài khoản';
  END IF;

  -- Cập nhật email_confirmed_at để tài khoản được đánh dấu là đã xác thực
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = target_user_id;
END;
$$;
