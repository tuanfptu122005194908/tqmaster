-- ============================================================
-- Clean up IP Blocking & Restore Standard Auth Signups
-- ============================================================

-- 1. Restore handle_new_user() without any domain or email blocking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  -- Auto-confirm email so no verification link is needed for created users
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = NEW.id AND email_confirmed_at IS NULL;

  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  final_username := base_username;

  -- Ensure username is unique
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, email, username, full_name, student_code, phone)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'student_code',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Drop IP blocking triggers and tables if they exist
DROP TRIGGER IF EXISTS tr_block_blacklisted_ip ON auth.users;
DROP FUNCTION IF EXISTS public.check_ip_blacklist();
DROP FUNCTION IF EXISTS public.is_ip_blocked(inet);
DROP FUNCTION IF EXISTS public.is_ip_blocked(text);

DROP TABLE IF EXISTS public.ip_logs CASCADE;
DROP TABLE IF EXISTS public.blocked_ips CASCADE;
