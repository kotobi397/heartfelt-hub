import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Droplets, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/drips")({
  head: () => ({ meta: [{ title: "Drip Campaigns · SolveBot GPT" }] }),
  component: DripsPage,
});

type Step = { day: number; message: string };
type Campaign = { id: string; name: string; is_active: boolean; steps: Step[]; created_at: string };

function DripsPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<Step[]>([
    { day: 1, message: "👋 مرحباً بك! نحن سعداء بانضمامك. هل تحتاج مساعدة في البداية؟" },
    { day: 3, message: "💡 هل جربت كل ميزاتنا؟ يمكنني مساعدتك في أي وقت." },
    { day: 7, message: "🎁 عرض خاص: خصم 15% على أول طلب! استخدم الكود WELCOME15" },
  ]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from("drip_campaigns").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as unknown as Campaign[]);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim() || steps.length === 0) return toast.error("اسم وخطوة واحدة على الأقل");
    setBusy(true);
    const cleanSteps = steps.filter(s => s.message.trim()).map(s => ({ day: Math.max(0, +s.day || 0), message: s.message.trim() }));
    const { error } = await supabase.from("drip_campaigns").insert({ name, steps: cleanSteps as any });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء الحملة");
    setName(""); load();
  }

  async function toggle(c: Campaign) {
    await supabase.from("drip_campaigns").update({ is_active: !c.is_active }).eq("id", c.id);
    load();
  }
  async function remove(id: string) {
    if (!confirm("حذف الحملة؟")) return;
    await supabase.from("drip_campaigns").delete().eq("id", id);
    load();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
          <div className="ml-auto font-semibold flex items-center gap-2"><Droplets className="w-4 h-4" /> Drip Campaigns</div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6 grid lg:grid-cols-2 gap-6">
        <Card className="p-6 h-fit">
          <h2 className="font-semibold mb-4">حملة جديدة</h2>
          <div className="space-y-4">
            <div>
              <Label>اسم الحملة</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="سلسلة الترحيب" />
            </div>
            <div>
              <Label>الخطوات</Label>
              <div className="space-y-2 mt-2">
                {steps.map((s, i) => (
                  <div key={i} className="grid grid-cols-[80px_1fr_auto] gap-2 items-start">
                    <div>
                      <Input type="number" min={0} value={s.day} onChange={e => {
                        const arr = [...steps]; arr[i] = { ...s, day: +e.target.value || 0 }; setSteps(arr);
                      }} />
                      <div className="text-[10px] text-muted-foreground mt-1 text-center">يوم</div>
                    </div>
                    <Textarea rows={2} value={s.message} onChange={e => {
                      const arr = [...steps]; arr[i] = { ...s, message: e.target.value }; setSteps(arr);
                    }} placeholder="نص الرسالة" />
                    <Button size="icon" variant="ghost" onClick={() => setSteps(steps.filter((_, j) => j !== i))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => setSteps([...steps, { day: (steps.at(-1)?.day ?? 0) + 1, message: "" }])}>
                  <Plus className="w-3 h-3 mr-1" /> خطوة
                </Button>
              </div>
            </div>
            <Button onClick={create} disabled={busy} className="w-full">
              {busy ? "جارٍ الإنشاء…" : "إنشاء الحملة"}
            </Button>
            <div className="text-xs text-muted-foreground">
              💡 المستخدمون الجدد يُسجَّلون تلقائياً في كل الحملات النشطة عند أول رسالة لهم. الرسائل تُرسل كل ساعة عبر cron.
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {items.length === 0 && <Card className="p-6 text-sm text-muted-foreground">لا توجد حملات.</Card>}
          {items.map(c => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.steps.length} خطوة · أنشئت {new Date(c.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={c.is_active} onCheckedChange={() => toggle(c)} />
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="space-y-1">
                {c.steps.map((s, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <Badge variant="secondary" className="shrink-0">يوم {s.day}</Badge>
                    <span className="text-muted-foreground line-clamp-2">{s.message}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
