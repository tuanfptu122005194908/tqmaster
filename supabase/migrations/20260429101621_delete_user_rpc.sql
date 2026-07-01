CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Chỉ cho phép admin xoá user
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Chỉ admin mới có quyền xoá người dùng';
  END IF;

  -- Xoá user trong auth.users
  -- (Do đã setup ON DELETE CASCADE, các dữ liệu trong profiles, user_roles, user_subjects,... sẽ tự động bị dọn sạch)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
