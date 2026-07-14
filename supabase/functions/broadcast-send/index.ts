// Sends a broadcast to all users active within the target window.
// Uses Facebook MESSAGE_TAG to bypass the 24h window (within Meta policy).

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

async function sendOne(senderId: string, text: string, tag: string): Promise<{ ok: boolean; error?: string }> {
  const token = Deno.env.get("FB_PAGE_ACCESS_TOKEN");
  if (!token) return { ok: false, error: "FB_PAGE_ACCESS_TOKEN missing" };
  try {
    const res = await fetch(`${FB_API}?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: senderId },
        messaging_type: "MESSAGE_TAG",
        tag,
        message: { text },
      }),
    });
    if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: String(err?.message ?? err) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const broadcastId: string | undefined = body?.broadcast_id;
  if (!broadcastId) return new Response(JSON.stringify({ error: "broadcast_id required" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });

  const db = admin();
  const { data: bc, error: bcErr } = await db.from("broadcasts").select("*").eq("id", broadcastId).maybeSingle();
  if (bcErr || !bc) return new Response(JSON.stringify({ error: "broadcast not found" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
  if (bc.status === "sending" || bc.status === "sent") {
    return new Response(JSON.stringify({ error: `broadcast already ${bc.status}` }), { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }

  await db.from("broadcasts").update({ status: "sending", started_at: new Date().toISOString() }).eq("id", broadcastId);

  const work = (async () => {
    const cutoff = new Date(Date.now() - bc.target_window_days * 86400_000).toISOString();
    const { data: msgs } = await db
      .from("messages")
      .select("facebook_user_id")
      .gte("created_at", cutoff)
      .limit(10000);
    const userIds = Array.from(new Set((msgs ?? []).map((m: any) => m.facebook_user_id)));

    let sent = 0, failed = 0;
    for (const uid of userIds) {
      const { error: insErr } = await db.from("broadcast_recipients").insert({
        broadcast_id: broadcastId, facebook_user_id: uid, status: "pending",
      });
      if (insErr) continue; // skip duplicates

      const result = await sendOne(uid, bc.message_text, bc.tag);
      if (result.ok) {
        sent++;
        await db.from("broadcast_recipients").update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("broadcast_id", broadcastId).eq("facebook_user_id", uid);
        await db.from("messages").insert({
          facebook_user_id: uid, sender_type: "bot",
          message_text: `📢 [Broadcast] ${bc.message_text}`,
        });
      } else {
        failed++;
        await db.from("broadcast_recipients").update({ status: "failed", error: result.error })
          .eq("broadcast_id", broadcastId).eq("facebook_user_id", uid);
      }
      await new Promise((r) => setTimeout(r, 80)); // gentle rate-limit
    }

    await db.from("broadcasts").update({
      status: failed > 0 && sent === 0 ? "failed" : "sent",
      sent_count: sent, failed_count: failed,
      completed_at: new Date().toISOString(),
    }).eq("id", broadcastId);
  })();

  // @ts-ignore EdgeRuntime
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(work);
  } else {
    work.catch((err) => console.error("[broadcast-send] bg failed", err));
  }

  return new Response(JSON.stringify({ ok: true, status: "sending" }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
