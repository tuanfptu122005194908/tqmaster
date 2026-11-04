-- Migration: 20261104000000_admin_devices.sql
-- Spec 38: Admin-only, single-device Android app.
-- Only ONE linked device is allowed in the whole system (single admin owner).

CREATE TABLE IF NOT EXISTS public.admin_devices (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id    text NOT NULL UNIQUE,
  device_name  text NOT NULL DEFAULT 'Android',
  fcm_token    text,
  linked_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

-- Hard guarantee: the table can never hold more than one row (one linked phone).
CREATE UNIQUE INDEX IF NOT EXISTS admin_devices_single_row ON public.admin_devices ((true));

ALTER TABLE public.admin_devices ENABLE ROW LEVEL SECURITY;

-- Admins may read the linked device (for the web "Thiáº¿t bá»‹ app" card). No direct writes.
DROP POLICY IF EXISTS "admins read admin_devices" ON public.admin_devices;
CREATE POLICY "admins read admin_devices" ON public.admin_devices
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.admin_devices FROM anon, authenticated;
GRANT SELECT ON public.admin_devices TO authenticated;

-- Link this phone. First admin device wins; any other device is rejected.
CREATE OR REPLACE FUNCTION public.claim_admin_device(
  p_device_id text,
  p_device_name text DEFAULT 'Android',
  p_fcm_token text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing public.admin_devices%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin') THEN
    RAISE EXCEPTION 'NOT_ADMIN' USING ERRCODE = '42501';
  END IF;
  IF p_device_id IS NULL OR length(trim(p_device_id)) < 8 THEN
    RAISE EXCEPTION 'INVALID_DEVICE' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_existing FROM public.admin_devices LIMIT 1;

  IF FOUND THEN
    IF v_existing.device_id <> p_device_id OR v_existing.user_id <> v_uid THEN
      RAISE EXCEPTION 'DEVICE_LOCKED' USING ERRCODE = '42501';
    END IF;
    UPDATE public.admin_devices
       SET fcm_token = COALESCE(p_fcm_token, fcm_token),
           device_name = COALESCE(NULLIF(p_device_name, ''), device_name),
           last_seen_at = now()
     WHERE id = v_existing.id;
    RETURN jsonb_build_object('linked', true, 'first_time', false);
  END IF;

  INSERT INTO public.admin_devices (user_id, device_id, device_name, fcm_token)
  VALUES (v_uid, p_device_id, COALESCE(NULLIF(p_device_name, ''), 'Android'), p_fcm_token);
  RETURN jsonb_build_object('linked', true, 'first_time', true);
END;
$$;

-- Heartbeat / token refresh. Returns false when this device is not the linked one.
CREATE OR REPLACE FUNCTION public.verify_admin_device(
  p_device_id text,
  p_fcm_token text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin') THEN
    RETURN false;
  END IF;
  SELECT id INTO v_id FROM public.admin_devices
   WHERE device_id = p_device_id AND user_id = v_uid;
  IF v_id IS NULL THEN
    RETURN false;
  END IF;
  UPDATE public.admin_devices
     SET fcm_token = COALESCE(p_fcm_token, fcm_token), last_seen_at = now()
   WHERE id = v_id;
  RETURN true;
END;
$$;

-- Unlink (used by the web admin "Thiáº¿t bá»‹ app" card). Any admin session can unlink.
CREATE OR REPLACE FUNCTION public.unlink_admin_device()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'NOT_ADMIN' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.admin_devices;
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_admin_device(text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.verify_admin_device(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unlink_admin_device() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin_device(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_device(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlink_admin_device() TO authenticated;

-- Called on in-app sign-out so the phone stops receiving pushes (stays linked).
CREATE OR REPLACE FUNCTION public.release_admin_device_token(p_device_id text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN false;
  END IF;
  UPDATE public.admin_devices SET fcm_token = NULL
   WHERE device_id = p_device_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.release_admin_device_token(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_admin_device_token(text) TO authenticated;
-- Make sure order inserts are broadcast over Realtime for the foreground alert.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- Email notifications stay OFF by default (push to the admin phone is the primary channel).
INSERT INTO public.system_settings (key, value)
VALUES ('admin_email_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
