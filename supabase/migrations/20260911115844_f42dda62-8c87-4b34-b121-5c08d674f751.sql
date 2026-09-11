CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Bỏ qua kiểm tra nếu không phải request từ client (service_role / trigger nội bộ)
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned
     OR NEW.ban_reason IS DISTINCT FROM OLD.ban_reason
     OR NEW.banned_at IS DISTINCT FROM OLD.banned_at
     OR NEW.banned_by IS DISTINCT FROM OLD.banned_by
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.student_code IS DISTINCT FROM OLD.student_code
     OR NEW.id IS DISTINCT FROM OLD.id
  THEN
    RAISE EXCEPTION 'Bạn không có quyền thay đổi các trường quản trị của hồ sơ';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_admin_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_admin_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_fields();