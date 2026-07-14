CREATE TABLE public.book_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facebook_user_id text NOT NULL UNIQUE,
  identifier text NOT NULL,
  title text,
  total_pages integer NOT NULL DEFAULT 0,
  current_page integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.book_sessions TO service_role;
ALTER TABLE public.book_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.book_search_cache (
  facebook_user_id text PRIMARY KEY,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.book_search_cache TO service_role;
ALTER TABLE public.book_search_cache ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_book_sessions_updated_at
  BEFORE UPDATE ON public.book_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();