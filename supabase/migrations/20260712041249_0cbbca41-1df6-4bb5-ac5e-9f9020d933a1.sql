
CREATE TABLE IF NOT EXISTS public.fb_send_rate (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fb_send_rate_ts_idx ON public.fb_send_rate (ts DESC);
GRANT ALL ON public.fb_send_rate TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.fb_send_rate_id_seq TO service_role;
ALTER TABLE public.fb_send_rate ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.fb_rate_reserve(_max int, _window_ms int DEFAULT 1000)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE cnt int;
BEGIN
  DELETE FROM public.fb_send_rate WHERE ts < now() - interval '10 seconds';
  SELECT count(*) INTO cnt FROM public.fb_send_rate
    WHERE ts > now() - (_window_ms::text || ' milliseconds')::interval;
  IF cnt >= _max THEN
    RETURN false;
  END IF;
  INSERT INTO public.fb_send_rate DEFAULT VALUES;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fb_rate_reserve(int, int) TO service_role;
