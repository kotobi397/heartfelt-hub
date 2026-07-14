import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Send, Megaphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/broadcasts")({
  head: () => ({ meta: [{ title: "Broadcasts · SolveBot GPT" }] }),
  component: BroadcastsPage,
});

type Broadcast = {
  id: string; message_text: string; status: string; sent_count: number;
  failed_count: number; target_window_days: number; tag: string; created_at: string;
};

function BroadcastsPage() {
  const [items, setItems] = useState<Broadcast[]>([]);
  const [message, setMessage] = useState("");
  const [tag, setTag] = useState("ACCOUNT_UPDATE");
  const [windowDays, setWindowDays] = useState(7);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from("broadcasts").select("*").order("created_at", { ascending: false }).limit(50);
    setItems((data ?? []) as Broadcast[]);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      const cutoff = new Date(Date.now() - windowDays * 86400_000).toISOString();
      const { data } = await supabase.from("messages").select("facebook_user_id").gte("created_at", cutoff).limit(10000);
      const unique = new Set((data ?? []).map((m: any) => m.facebook_user_id));
      setAudienceCount(unique.size);
    })();
  }, [windowDays]);

  async function createAndSend() {
    if (!message.trim()) return toast.error("اكتب نص الرسالة");
    setBusy(true);
    const { data: user } = await supabase.auth.getUser();
    const { data: bc, error } = await supabase.from("broadcasts").insert({
      message_text: message, tag, target_window_days: windowDays,
      created_by: user.user?.id,
    }).select().single();
    if (error || !bc) { setBusy(false); return toast.error(error?.message ?? "فشل الإنشاء"); }

    const { data: sess } = await supabase.auth.getSession();
    const res = await fetch(`https://znepqljtvkumdqlohbwq.supabase.co/functions/v1/broadcast-send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
      body: JSON.stringify({ broadcast_id: bc.id }),
    });
    setBusy(false);
    if (!res.ok) return toast.error("فشل بدء الإرسال");
    toast.success(`بدأ إرسال الحملة لـ ~${audienceCount ?? 0} مستخدم`);
    setMessage("");
    load();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
          <div className="ml-auto font-semibold flex items-center gap-2"><Megaphone className="w-4 h-4" /> Broadcasts</div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6 grid lg:grid-cols-[1fr_400px] gap-6">
        <Card className="p-6 h-fit">
          <h2 className="font-semibold mb-4">حملة جديدة</h2>
          <div className="space-y-4">
            <div>
              <Label>نص الرسالة</Label>
              <Textarea rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder="مثال: 🎉 خصم 20% لمدة 48 ساعة فقط على كل المنتجات!" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">المستلمون: نشطون آخر</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="number" min={1} max={30} value={windowDays} onChange={e => setWindowDays(Math.max(1, Math.min(30, +e.target.value || 7)))} className="w-20" />
                  <span className="text-sm text-muted-foreground">يوم</span>
                </div>
              </div>
              <div>
                <Label className="text-xs">Message Tag</Label>
                <select className="w-full mt-1 h-10 rounded-md border bg-background px-3 text-sm" value={tag} onChange={e => setTag(e.target.value)}>
                  <option value="ACCOUNT_UPDATE">ACCOUNT_UPDATE</option>
                  <option value="POST_PURCHASE_UPDATE">POST_PURCHASE_UPDATE</option>
                  <option value="CONFIRMED_EVENT_UPDATE">CONFIRMED_EVENT_UPDATE</option>
                  <option value="HUMAN_AGENT">HUMAN_AGENT</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/40 rounded-md p-3">
              سيُرسل لـ <strong className="text-foreground">{audienceCount ?? "…"}</strong> مستخدم فريد تفاعلوا في آخر {windowDays} يوم.
              <div className="mt-1 text-xs">⚠️ سياسة ميتا: استخدم الـ tag المناسب لمحتوى رسالتك فقط، وإلا قد يُحظر صفحتك.</div>
            </div>
            <Button onClick={createAndSend} disabled={busy || !message.trim()} className="w-full">
              <Send className="w-4 h-4 mr-2" />{busy ? "جارٍ الإرسال…" : "إنشاء وإرسال"}
            </Button>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b font-semibold text-sm">السجل ({items.length})</div>
          <div className="max-h-[700px] overflow-y-auto">
            {items.length === 0 && <div className="p-6 text-sm text-muted-foreground">لا توجد حملات بعد.</div>}
            {items.map(b => (
              <div key={b.id} className="p-4 border-b last:border-b-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={b.status === "sent" ? "default" : b.status === "sending" ? "secondary" : b.status === "failed" ? "destructive" : "outline"}>{b.status}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</span>
                </div>
                <div className="text-sm line-clamp-3">{b.message_text}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  ✓ {b.sent_count} مرسل · ✗ {b.failed_count} فاشل · {b.tag}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
