import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400",
};

function getSupabaseMessengerUrl(requestUrl: string) {
  const incoming = new URL(requestUrl);
  const supabaseUrl = process.env.SUPABASE_URL || "https://znepqljtvkumdqlohbwq.supabase.co";
  const target = new URL("/functions/v1/messenger", supabaseUrl);
  target.search = incoming.search;
  return target;
}

async function proxyToMessenger(request: Request) {
  const target = getSupabaseMessengerUrl(request.url);
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
  });

  const responseHeaders = new Headers(corsHeaders);
  const upstreamContentType = response.headers.get("content-type");
  if (upstreamContentType) responseHeaders.set("content-type", upstreamContentType);

  return new Response(await response.text(), {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const Route = createFileRoute("/api/public/messenger")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ request }) => proxyToMessenger(request),
      POST: async ({ request }) => proxyToMessenger(request),
    },
  },
});