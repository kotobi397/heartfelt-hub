
CREATE OR REPLACE FUNCTION public.get_bot_stats(period_days int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  since timestamptz := now() - make_interval(days => period_days);
  bot_count bigint;
  user_count bigint;
  session_count bigint;
  daily jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT count(*) INTO bot_count FROM public.messages
    WHERE sender_type = 'bot' AND created_at >= since;
  SELECT count(*) INTO user_count FROM public.messages
    WHERE sender_type = 'user' AND created_at >= since;
  SELECT count(*) INTO session_count FROM (
    SELECT DISTINCT facebook_user_id, date_trunc('day', created_at) AS d
    FROM public.messages WHERE created_at >= since
  ) s;

  SELECT coalesce(jsonb_agg(row_to_json(t) ORDER BY t.day), '[]'::jsonb) INTO daily FROM (
    SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
           count(*) FILTER (WHERE sender_type = 'bot') AS bot,
           count(*) FILTER (WHERE sender_type = 'user') AS "user",
           count(DISTINCT facebook_user_id) AS sessions
    FROM public.messages
    WHERE created_at >= since
    GROUP BY 1
  ) t;

  RETURN jsonb_build_object(
    'bot', bot_count,
    'user', user_count,
    'sessions', session_count,
    'daily', daily
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_bot_stats(int) TO authenticated;
