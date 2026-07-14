
-- Enable pg_cron and pg_net for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============ BROADCASTS ============
CREATE TABLE public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_text TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'ACCOUNT_UPDATE',
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sending, sent, failed
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  target_window_days INT NOT NULL DEFAULT 7,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broadcasts TO authenticated;
GRANT ALL ON public.broadcasts TO service_role;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage broadcasts" ON public.broadcasts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  facebook_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (broadcast_id, facebook_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broadcast_recipients TO authenticated;
GRANT ALL ON public.broadcast_recipients TO service_role;
ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view recipients" ON public.broadcast_recipients
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ DRIP CAMPAIGNS ============
CREATE TABLE public.drip_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{day:1,message:"..."},{day:3,...}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drip_campaigns TO authenticated;
GRANT ALL ON public.drip_campaigns TO service_role;
ALTER TABLE public.drip_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage drip campaigns" ON public.drip_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER drip_campaigns_updated_at
  BEFORE UPDATE ON public.drip_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.drip_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.drip_campaigns(id) ON DELETE CASCADE,
  facebook_user_id TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_step_index INT NOT NULL DEFAULT -1, -- -1 = none sent yet
  last_step_sent_at TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (campaign_id, facebook_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drip_enrollments TO authenticated;
GRANT ALL ON public.drip_enrollments TO service_role;
ALTER TABLE public.drip_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view enrollments" ON public.drip_enrollments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_drip_enrollments_pending
  ON public.drip_enrollments (campaign_id, completed, last_step_sent_at);

-- ============ PERSONAS ============
CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  page_id TEXT,                    -- if set, only matches this FB page
  active_from_hour INT,            -- 0-23, NULL = anytime
  active_to_hour INT,              -- 0-23, NULL = anytime
  priority INT NOT NULL DEFAULT 0, -- higher wins
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personas TO authenticated;
GRANT ALL ON public.personas TO service_role;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage personas" ON public.personas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER personas_updated_at
  BEFORE UPDATE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ MESSAGE FEEDBACK ============
CREATE TABLE public.message_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  facebook_user_id TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)), -- -1 = 👎, +1 = 👍
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, facebook_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_feedback TO authenticated;
GRANT ALL ON public.message_feedback TO service_role;
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view feedback" ON public.message_feedback
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ MESSAGES: response time + page tracking ============
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS response_time_ms INT,
  ADD COLUMN IF NOT EXISTS page_id TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_fb_user_created
  ON public.messages (facebook_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_text_search
  ON public.messages USING gin (to_tsvector('simple', message_text));
