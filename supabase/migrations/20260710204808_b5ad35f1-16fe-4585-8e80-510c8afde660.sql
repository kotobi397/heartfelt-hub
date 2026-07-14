
-- Facebook user profiles cache
CREATE TABLE IF NOT EXISTS public.facebook_profiles (
  facebook_user_id text PRIMARY KEY,
  name text,
  first_name text,
  last_name text,
  profile_pic text,
  page_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.facebook_profiles TO authenticated;
GRANT ALL ON public.facebook_profiles TO service_role;

ALTER TABLE public.facebook_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read fb profiles"
  ON public.facebook_profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_fb_profiles_updated ON public.facebook_profiles;
CREATE TRIGGER trg_fb_profiles_updated
  BEFORE UPDATE ON public.facebook_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime on messages + profiles
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.facebook_profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.facebook_profiles;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
