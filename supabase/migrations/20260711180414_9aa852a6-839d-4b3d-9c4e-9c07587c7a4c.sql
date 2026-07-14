
CREATE TABLE public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facebook_user_id text NOT NULL UNIQUE,
  reason text,
  offending_message text,
  blocked_at timestamptz NOT NULL DEFAULT now(),
  unblocked_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);
CREATE INDEX blocked_users_active_idx ON public.blocked_users (facebook_user_id) WHERE is_active = true;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_users TO authenticated;
GRANT ALL ON public.blocked_users TO service_role;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view blocked_users" ON public.blocked_users FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert blocked_users" ON public.blocked_users FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update blocked_users" ON public.blocked_users FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete blocked_users" ON public.blocked_users FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
