// Drip campaign runner — called by pg_cron hourly.
// Finds enrolled users whose next step is due and sends it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const FB_API = "https://graph.facebook.com/v19.0/me/messages";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function sendOne(senderId: string, text: string): Promise<boolean> {
  const token = Deno.env.get("FB_PAGE_ACCESS_TOKEN");
  if (!token) return false;
  try {
    const res = await fetch(`${FB_API}?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: senderId },
        messaging_type: "MESSAGE_TAG",
        tag: "ACCOUNT_UPDATE",
        message: { text },
      }),
    });
    return res.ok;
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const db = admin();
  const { data: campaigns } = await db.from("drip_campaigns").select("*").eq("is_active", true);
  if (!campaigns?.length) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
  }

  let processed = 0, sent = 0;

  for (const c of campaigns) {
    const steps = Array.isArray(c.steps) ? c.steps : [];
    if (!steps.length) continue;

    const { data: enrollments } = await db
      .from("drip_enrollments")
      .select("*")
      .eq("campaign_id", c.id)
      .eq("completed", false)
      .limit(500);

    for (const en of enrollments ?? []) {
      processed++;
      const nextIdx = en.last_step_index + 1;
      if (nextIdx >= steps.length) {
        await db.from("drip_enrollments").update({ completed: true }).eq("id", en.id);
        continue;
      }
      const step = steps[nextIdx];
      const stepDay = Number(step?.day ?? 0);
      const stepMessage = String(step?.message ?? "").trim();
      if (!stepMessage) continue;

      const enrolledAt = new Date(en.enrolled_at).getTime();
      const dueAt = enrolledAt + stepDay * 86400_000;
      if (Date.now() < dueAt) continue;

      const ok = await sendOne(en.facebook_user_id, stepMessage);
      if (ok) {
        sent++;
        await db.from("drip_enrollments").update({
          last_step_index: nextIdx,
          last_step_sent_at: new Date().toISOString(),
          completed: nextIdx + 1 >= steps.length,
        }).eq("id", en.id);
        await db.from("messages").insert({
          facebook_user_id: en.facebook_user_id, sender_type: "bot",
          message_text: `💧 [Drip ${c.name}] ${stepMessage}`,
        });
      }
      await new Promise((r) => setTimeout(r, 80));
    }
  }

  return new Response(JSON.stringify({ ok: true, processed, sent }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
