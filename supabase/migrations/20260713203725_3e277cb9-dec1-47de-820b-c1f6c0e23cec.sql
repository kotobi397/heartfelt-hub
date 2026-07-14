ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS mid text, ADD COLUMN IF NOT EXISTS reply_to_mid text;
CREATE INDEX IF NOT EXISTS idx_messages_mid ON public.messages (mid) WHERE mid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_mid ON public.messages (reply_to_mid) WHERE reply_to_mid IS NOT NULL;