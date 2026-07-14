CREATE OR REPLACE FUNCTION public.get_bot_stats(period_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  bot_count bigint;
  user_count bigint;
  session_count bigint;
  daily jsonb;
  hourly jsonb;
  hour_start timestamptz;
  day_start timestamptz;
  since timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Align to whole hour / whole day boundaries in UTC so counts don't
  -- drift second-by-second and buckets are never partial.
  hour_start := date_trunc('hour', now() at time zone 'UTC') - make_interval(hours => 23);
  day_start  := date_trunc('day',  now() at time zone 'UTC') - make_interval(days  => period_days - 1);

  IF period_days <= 1 THEN
    since := hour_start;
  ELSE
    since := day_start;
  END IF;

  SELECT count(*) INTO bot_count FROM public.messages
    WHERE sender_type = 'bot' AND created_at >= since;
  SELECT count(*) INTO user_count FROM public.messages
    WHERE sender_type = 'user' AND created_at >= since;
  SELECT count(DISTINCT facebook_user_id) INTO session_count
    FROM public.messages WHERE created_at >= since;

  -- Daily series: aligned UTC day buckets, always dense (LEFT JOIN generate_series).
  SELECT coalesce(jsonb_agg(row_to_json(t) ORDER BY t.day), '[]'::jsonb) INTO daily FROM (
    SELECT to_char(gs.day, 'YYYY-MM-DD') AS day,
           coalesce(count(*) FILTER (WHERE m.sender_type = 'bot'), 0)  AS bot,
           coalesce(count(*) FILTER (WHERE m.sender_type = 'user'), 0) AS "user",
           coalesce(count(DISTINCT m.facebook_user_id), 0)             AS sessions
    FROM generate_series(
      date_trunc('day', now() at time zone 'UTC') - make_interval(days => GREATEST(period_days,1) - 1),
      date_trunc('day', now() at time zone 'UTC'),
      interval '1 day'
    ) AS gs(day)
    LEFT JOIN public.messages m
      ON m.created_at >= gs.day
     AND m.created_at <  gs.day + interval '1 day'
    GROUP BY gs.day
  ) t;

  -- Hourly series: 24 aligned UTC hours, always dense.
  SELECT coalesce(jsonb_agg(row_to_json(h) ORDER BY h.hour), '[]'::jsonb) INTO hourly FROM (
    SELECT to_char(gs.hour, 'YYYY-MM-DD"T"HH24:00') AS hour,
           coalesce(count(*) FILTER (WHERE m.sender_type = 'bot'), 0)  AS bot,
           coalesce(count(*) FILTER (WHERE m.sender_type = 'user'), 0) AS "user",
           coalesce(count(DISTINCT m.facebook_user_id), 0)             AS sessions
    FROM generate_series(
      date_trunc('hour', now() at time zone 'UTC') - make_interval(hours => 23),
      date_trunc('hour', now() at time zone 'UTC'),
      interval '1 hour'
    ) AS gs(hour)
    LEFT JOIN public.messages m
      ON m.created_at >= gs.hour
     AND m.created_at <  gs.hour + interval '1 hour'
    GROUP BY gs.hour
  ) h;

  RETURN jsonb_build_object(
    'bot', bot_count,
    'user', user_count,
    'sessions', session_count,
    'daily', daily,
    'hourly', hourly
  );
END;
$function$;