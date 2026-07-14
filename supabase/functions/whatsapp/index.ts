// WhatsApp Cloud API webhook — same brain as messenger (Mistral + personas + memory).
// Handles GET verify + POST incoming messages. Text-only for now.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const TEXT_MODEL = "mistral-large-2512";
const HISTORY_LIMIT = 40;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function getAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function getMistralKey(admin: any): Promise<string | null> {
  try {
    const { data } = await admin.from("app_config")
      .select("mistral_api_key, mistral_api_keys").limit(1).maybeSingle();
    const list = (data as any)?.mistral_api_keys;
    if (Array.isArray(list) && list.length > 0) {
      const usable = list.filter((k: any) => typeof k === "string" && k.trim());
      if (usable.length) return usable[Math.floor(Math.random() * usable.length)].trim();
    }
    const single = (data as any)?.mistral_api_key;
    if (typeof single === "string" && single.trim()) return single.trim();
  } catch (_e) { /* fall through */ }
  return Deno.env.get("MISTRAL_API_KEY") ?? null;
}

async function pickPersona(admin: any, fallback: string): Promise<string> {
  const { data: personas } = await admin.from("personas").select("*").eq("is_active", true);
  if (!personas?.length) return fallback;
  const hour = new Date().getUTCHours();
  const matches = personas.filter((p: any) => {
    if (p.page_id) return false; // whatsapp is not tied to a fb page
    const fromH = p.active_from_hour, toH = p.active_to_hour;
    if (fromH != null && toH != null) {
      if (fromH <= toH) { if (hour < fromH || hour >= toH) return false; }
      else { if (hour < fromH && hour >= toH) return false; }
    }
    return true;
  });
  if (!matches.length) return fallback;
  matches.sort((a: any, b: any) => (b.priority ?? 0) - (a.priority ?? 0));
  return matches[0].system_prompt;
}

async function loadHistory(admin: any, userKey: string): Promise<{ role: string; content: string }[]> {
  const { data } = await admin
    .from("messages")
    .select("sender_type, content")
    .eq("facebook_user_id", userKey)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  const rows = (data ?? []).reverse();
  return rows.map((r: any) => ({
    role: r.sender_type === "bot" ? "assistant" : "user",
    content: r.content ?? "",
  })).filter((m: any) => m.content);
}

async function callMistral(key: string, system: string, history: any[], userText: string): Promise<string> {
  const messages = [
    { role: "system", content: system },
    ...history,
    { role: "user", content: userText },
  ];
  const res = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: TEXT_MODEL, temperature: 0.7, max_tokens: 1024, messages }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("[whatsapp] mistral error", res.status, txt.slice(0, 200));
    return "عذراً، حدث خطأ مؤقت. حاول مرة أخرى بعد قليل.";
  }
  const j = await res.json();
  return j?.choices?.[0]?.message?.content?.trim() || "…";
}

async function sendWhatsAppText(to: string, text: string): Promise<void> {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_ID");
  if (!token || !phoneId) {
    console.error("[whatsapp] missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID");
    return;
  }
  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text.slice(0, 4000) },
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("[whatsapp] send error", res.status, t.slice(0, 300));
  }
}

async function handleMessage(admin: any, from: string, text: string, wamid: string | null) {
  // Dedupe on WhatsApp message id
  if (wamid) {
    const { error } = await admin.from("processed_messages").insert({ mid: `wa:${wamid}` });
    if (error && ((error as any).code === "23505" || /duplicate/i.test(error.message ?? ""))) {
      return;
    }
  }

  const userKey = `wa:${from}`;

  // Check block list
  const { data: blocked } = await admin.from("blocked_users")
    .select("facebook_user_id").eq("facebook_user_id", userKey).maybeSingle();
  if (blocked) return;

  // Log user message
  await admin.from("messages").insert({
    facebook_user_id: userKey,
    sender_type: "user",
    content: text,
  });

  const key = await getMistralKey(admin);
  if (!key) {
    await sendWhatsAppText(from, "البوت غير مهيأ (مفتاح Mistral مفقود).");
    return;
  }

  const persona = await pickPersona(admin, "أنت مساعد ذكي ومهذب، ترد باللغة العربية بشكل واضح ومفيد.");
  const history = await loadHistory(admin, userKey);
  const reply = await callMistral(key, persona, history, text);

  await sendWhatsAppText(from, reply);

  await admin.from("messages").insert({
    facebook_user_id: userKey,
    sender_type: "bot",
    content: reply,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Webhook verification (Meta calls with GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const expected = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    if (mode === "subscribe" && token && expected && token === expected) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let body: any;
  try { body = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }

  // Always ACK quickly to Meta
  const respond = () => new Response("EVENT_RECEIVED", { status: 200, headers: corsHeaders });

  try {
    const admin = getAdmin();
    const entries = body?.entry ?? [];
    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        const value = change?.value;
        const messages = value?.messages ?? [];
        for (const msg of messages) {
          const from: string = msg?.from;
          const wamid: string | null = msg?.id ?? null;
          if (!from) continue;

          let text: string | null = null;
          if (msg?.type === "text") text = msg?.text?.body ?? null;
          else if (msg?.type === "button") text = msg?.button?.text ?? null;
          else if (msg?.type === "interactive") {
            text = msg?.interactive?.button_reply?.title
              ?? msg?.interactive?.list_reply?.title
              ?? null;
          } else {
            text = "[رسالة غير نصية — أرسل نصاً من فضلك]";
          }

          if (!text) continue;
          // Process async so we ACK fast
          handleMessage(admin, from, text, wamid).catch((e) =>
            console.error("[whatsapp] handle error", e)
          );
        }
      }
    }
  } catch (e) {
    console.error("[whatsapp] fatal", e);
  }
  return respond();
});
