
ALTER TABLE public.bot_settings
  ADD COLUMN IF NOT EXISTS answer_length text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS tone text NOT NULL DEFAULT 'professional',
  ADD COLUMN IF NOT EXISTS allow_customer_length_config boolean NOT NULL DEFAULT false;

ALTER TABLE public.bot_settings
  DROP CONSTRAINT IF EXISTS bot_settings_answer_length_check,
  ADD CONSTRAINT bot_settings_answer_length_check CHECK (answer_length IN ('short','normal','long'));

ALTER TABLE public.bot_settings
  DROP CONSTRAINT IF EXISTS bot_settings_tone_check,
  ADD CONSTRAINT bot_settings_tone_check CHECK (tone IN ('professional','gentle','direct','empathetic','friendly'));
