
CREATE TABLE IF NOT EXISTS public.processed_messages (
  mid TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.processed_messages TO service_role;

ALTER TABLE public.processed_messages ENABLE ROW LEVEL SECURITY;

-- no public policies; only service_role (used by the edge function) accesses it
