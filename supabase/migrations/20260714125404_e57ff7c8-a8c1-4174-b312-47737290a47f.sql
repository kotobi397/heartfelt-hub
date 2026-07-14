
CREATE TABLE public.latest_post_sends (
  facebook_user_id text NOT NULL,
  page_id text NOT NULL DEFAULT '',
  last_post_id text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (facebook_user_id, page_id)
);
GRANT ALL ON public.latest_post_sends TO service_role;
ALTER TABLE public.latest_post_sends ENABLE ROW LEVEL SECURITY;
