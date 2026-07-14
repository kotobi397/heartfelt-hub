
CREATE TABLE public.novel_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facebook_user_id text NOT NULL,
  title text NOT NULL,
  genre text,
  premise text,
  protagonist text,
  style text,
  current_chapter int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.novel_sessions TO authenticated;
GRANT ALL ON public.novel_sessions TO service_role;
ALTER TABLE public.novel_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage novel sessions" ON public.novel_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER novel_sessions_updated_at BEFORE UPDATE ON public.novel_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.novel_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.novel_sessions(id) ON DELETE CASCADE,
  chapter_number int NOT NULL,
  title text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, chapter_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.novel_chapters TO authenticated;
GRANT ALL ON public.novel_chapters TO service_role;
ALTER TABLE public.novel_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage novel chapters" ON public.novel_chapters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_novel_sessions_user ON public.novel_sessions(facebook_user_id, status);
CREATE INDEX idx_novel_chapters_session ON public.novel_chapters(session_id, chapter_number);
