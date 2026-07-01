CREATE TABLE public.active_sessions (
  user_id uuid NOT NULL PRIMARY KEY,
  session_id text NOT NULL,
  user_agent text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_sessions TO authenticated;
GRANT ALL ON public.active_sessions TO service_role;

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_session"
ON public.active_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_session"
ON public.active_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_session"
ON public.active_sessions FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_session"
ON public.active_sessions FOR DELETE
USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
ALTER TABLE public.active_sessions REPLICA IDENTITY FULL;