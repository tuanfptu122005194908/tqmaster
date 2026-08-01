-- ============================================================
-- Enforce Google OAuth / Admin Signups Only in handle_new_user()
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
    ''
  ));

  is_admin_created := (COALESCE(NEW.raw_user_meta_data->>'created_by_admin', 'false') = 'true');

  -- Check if signup provider is Google (OAuth, ID Token, or Google JWT issuer)
  IF provider_name = 'google'
     OR (NEW.raw_app_meta_data->'providers')::text LIKE '%google%'
     OR (NEW.raw_user_meta_data->>'iss') LIKE '%google%'
     OR (NEW.raw_user_meta_data->>'provider') = 'google'
  THEN
    is_google := TRUE;
  END IF;

  -- Strictly block manual email signups if not Google and not Admin
  IF NOT is_google AND NOT is_admin_created THEN
    RAISE EXCEPTION 'Đăng ký trực tiếp bằng Email đã bị khóa. Vui lòng sử dụng Đăng ký bằng Google.';
  END IF;

  -- Generate unique username from metadata or email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1),
    'user'
  );
  final_username := base_username;

  -- Ensure username is unique in profiles
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::TEXT;
  END LOOP;

  -- Insert profile record
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

  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Clean up IP blocking triggers and tables if they exist
DROP TRIGGER IF EXISTS tr_block_blacklisted_ip ON auth.users;
DROP FUNCTION IF EXISTS public.check_ip_blacklist();
DROP FUNCTION IF EXISTS public.is_ip_blocked(inet);
DROP FUNCTION IF EXISTS public.is_ip_blocked(text);

DROP TABLE IF EXISTS public.ip_logs CASCADE;
DROP TABLE IF EXISTS public.blocked_ips CASCADE;
