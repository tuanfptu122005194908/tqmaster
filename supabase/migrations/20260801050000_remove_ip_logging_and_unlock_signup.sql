-- ============================================================
-- Fix handle_new_user() trigger for Google OAuth & ID Token Signups
-- ============================================================

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
  provider_name TEXT;
  is_admin_created BOOLEAN := FALSE;
  is_google BOOLEAN := FALSE;
BEGIN
  provider_name := LOWER(COALESCE(
    NEW.raw_app_meta_data->>'provider',
    NEW.app_metadata->>'provider',
    ''
  ));

  is_admin_created := (COALESCE(NEW.raw_user_meta_data->>'created_by_admin', 'false') = 'true');

  -- Robust check for Google provider (OAuth, ID Token, or Google JWT issuer)
  IF provider_name = 'google'
     OR (NEW.raw_app_meta_data->'providers')::text LIKE '%google%'
     OR (NEW.raw_user_meta_data->>'iss') LIKE '%google%'
     OR (NEW.raw_user_meta_data->>'provider') = 'google'
  THEN
    is_google := TRUE;
  END IF;

  -- Block manual email signups if not Google and not Admin
  IF NOT is_google AND NOT is_admin_created THEN
    IF provider_name = 'email' OR provider_name = '' THEN
      RAISE EXCEPTION 'Đăng ký trực tiếp bằng Email đã bị khóa. Vui lòng sử dụng Đăng ký bằng Google.';
    END IF;
  END IF;

  -- Auto-confirm email for Google or Admin created accounts
  IF is_google OR is_admin_created THEN
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = NEW.id AND email_confirmed_at IS NULL;
  END IF;

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
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
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

-- Drop IP blocking triggers and tables if they exist
DROP TRIGGER IF EXISTS tr_block_blacklisted_ip ON auth.users;
DROP FUNCTION IF EXISTS public.check_ip_blacklist();
DROP FUNCTION IF EXISTS public.is_ip_blocked(inet);
DROP FUNCTION IF EXISTS public.is_ip_blocked(text);

DROP TABLE IF EXISTS public.ip_logs CASCADE;
DROP TABLE IF EXISTS public.blocked_ips CASCADE;
