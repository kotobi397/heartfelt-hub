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
import { ArrowLeft, Bot, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/personas")({
  head: () => ({ meta: [{ title: "Personas · SolveBot GPT" }] }),
  component: PersonasPage,
});

type Persona = {
  id: string; name: string; system_prompt: string; page_id: string | null;
  active_from_hour: number | null; active_to_hour: number | null;
  priority: number; is_active: boolean;
};

function PersonasPage() {
  const [items, setItems] = useState<Persona[]>([]);
  const [form, setForm] = useState({
    name: "", system_prompt: "", page_id: "",
    active_from_hour: "", active_to_hour: "", priority: 0,
  });
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from("personas").select("*").order("priority", { ascending: false });
    setItems((data ?? []) as Persona[]);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.name.trim() || !form.system_prompt.trim()) return toast.error("اسم وprompt مطلوبان");
    setBusy(true);
    const { error } = await supabase.from("personas").insert({
      name: form.name, system_prompt: form.system_prompt,
      page_id: form.page_id.trim() || null,
      active_from_hour: form.active_from_hour === "" ? null : +form.active_from_hour,
      active_to_hour: form.active_to_hour === "" ? null : +form.active_to_hour,
      priority: +form.priority || 0,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء الشخصية");
    setForm({ name: "", system_prompt: "", page_id: "", active_from_hour: "", active_to_hour: "", priority: 0 });
    load();
  }

  async function toggle(p: Persona) {
    await supabase.from("personas").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  }
  async function remove(id: string) {
    if (!confirm("حذف الشخصية؟")) return;
    await supabase.from("personas").delete().eq("id", id);
    load();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
          <div className="ml-auto font-semibold flex items-center gap-2"><Bot className="w-4 h-4" /> Personas</div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6 grid lg:grid-cols-2 gap-6">
        <Card className="p-6 h-fit">
          <h2 className="font-semibold mb-4">شخصية جديدة</h2>
          <div className="space-y-3">
            <div>
              <Label>الاسم</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مساعد ودود نهاراً" />
            </div>
            <div>
              <Label>System Prompt</Label>
              <Textarea rows={6} value={form.system_prompt} onChange={e => setForm({ ...form, system_prompt: e.target.value })}
                placeholder="أنت مساعد ودود ومرح. تحدث بالعربية الفصحى مع لمسة دافئة..." className="font-mono text-sm" />
            </div>
            <div>
              <Label>Page ID (اختياري)</Label>
              <Input value={form.page_id} onChange={e => setForm({ ...form, page_id: e.target.value })} placeholder="اتركه فارغاً لكل الصفحات" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">من ساعة (UTC)</Label>
                <Input type="number" min={0} max={23} value={form.active_from_hour} onChange={e => setForm({ ...form, active_from_hour: e.target.value })} placeholder="0-23" />
              </div>
              <div>
                <Label className="text-xs">إلى ساعة (UTC)</Label>
                <Input type="number" min={0} max={23} value={form.active_to_hour} onChange={e => setForm({ ...form, active_to_hour: e.target.value })} placeholder="0-23" />
              </div>
              <div>
                <Label className="text-xs">أولوية</Label>
                <Input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: +e.target.value || 0 })} />
              </div>
            </div>
            <Button onClick={create} disabled={busy} className="w-full">{busy ? "جارٍ…" : "إنشاء"}</Button>
            <div className="text-xs text-muted-foreground">
              عند وصول رسالة، يُختار أعلى persona مطابقة لـ (page_id والوقت)، ثم الأعلى أولوية. بدون تطابق → system prompt الافتراضي.
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {items.length === 0 && <Card className="p-6 text-sm text-muted-foreground">لا توجد شخصيات. الـ system prompt الافتراضي مستخدم.</Card>}
          {items.map(p => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {p.name}
                    <Badge variant="outline" className="text-xs">P{p.priority}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {p.page_id ? `📘 ${p.page_id}` : "كل الصفحات"} ·{" "}
                    {p.active_from_hour != null ? `${p.active_from_hour}h-${p.active_to_hour}h UTC` : "كل الأوقات"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={p.is_active} onCheckedChange={() => toggle(p)} />
                  <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 mt-2 font-mono">{p.system_prompt}</p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
