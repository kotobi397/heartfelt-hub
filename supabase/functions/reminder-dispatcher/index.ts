// Reminder dispatcher — runs every minute via pg_cron.
// Sends due reminders via Facebook Messenger and marks them sent.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const FB_API = "https://graph.facebook.com/v19.0/me/messages";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const pageToken = Deno.env.get("FB_PAGE_ACCESS_TOKEN");
  if (!pageToken) return new Response("missing FB_PAGE_ACCESS_TOKEN", { status: 500 });

  const { data: due, error } = await supabase
    .from("reminders")
    .select("id, facebook_user_id, message")
    .eq("sent", false)
    .lte("remind_at", new Date().toISOString())
    .limit(50);

  if (error) {
    console.error("[reminder-dispatcher] db error", error);
    return new Response("db error", { status: 500 });
  }

  let sent = 0;
  for (const r of due ?? []) {
    try {
      const text = `🔔 تذكير: ${r.message}`;
      const res = await fetch(`${FB_API}?access_token=${encodeURIComponent(pageToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: r.facebook_user_id },
          // Reminders are outside the 24h window for many users → MESSAGE_TAG
          messaging_type: "MESSAGE_TAG",
          tag: "CONFIRMED_EVENT_UPDATE",
          message: { text },
        }),
      });
      if (!res.ok) {
        console.error("[reminder-dispatcher] FB send failed", res.status, await res.text());
        continue;
      }
      await supabase
        .from("reminders")
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq("id", r.id);
      await supabase.from("messages").insert({
        facebook_user_id: r.facebook_user_id,
        sender_type: "bot",
        message_text: text,
      });
      sent++;
    } catch (err) {
      console.error("[reminder-dispatcher] error", err);
    }
  }

  return new Response(JSON.stringify({ checked: (due ?? []).length, sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
