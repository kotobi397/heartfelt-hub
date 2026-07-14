
CREATE TABLE public.manga_sessions (
  facebook_user_id text PRIMARY KEY,
  manga_id text NOT NULL,
  manga_title text NOT NULL,
  chapters jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_chapter_idx integer NOT NULL DEFAULT 0,
  current_page integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.manga_sessions TO service_role;
ALTER TABLE public.manga_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.manga_search_cache (
  facebook_user_id text PRIMARY KEY,
  results jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.manga_search_cache TO service_role;
ALTER TABLE public.manga_search_cache ENABLE ROW LEVEL SECURITY;
