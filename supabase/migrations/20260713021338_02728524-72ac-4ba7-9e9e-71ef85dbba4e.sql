CREATE TABLE IF NOT EXISTS public.image_search_sessions (
  facebook_user_id text PRIMARY KEY,
  query text NOT NULL,
  offset_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.image_search_sessions TO service_role;
ALTER TABLE public.image_search_sessions ENABLE ROW LEVEL SECURITY;