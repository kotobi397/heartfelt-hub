import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { Bot, LogOut, MessageSquare, Users, Activity, Copy, Clock, ThumbsUp, Search, Download, Megaphone, Droplets, ArrowRight, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Dashboard · SolveBot GPT" }] }),
  component: AdminPage,
});

type Msg = {
  id: string;
  facebook_user_id: string;
  sender_type: string;
  message_text: string;
  created_at: string;
  response_time_ms?: number | null;
  page_id?: string | null;
};

function getWebhookUrl() {
  if (typeof window === "undefined") return "";
  const { hostname, origin } = window.location;
  const previewMatch = hostname.match(/^id-preview--([0-9a-f-]{36})\.lovable\.app$/);
  if (previewMatch) return `https://project--${previewMatch[1]}-dev.lovable.app/api/public/messenger`;
  return `${origin}/api/public/messenger`;
}

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      const { data } = await supabase.from("user_roles").select("role")
        .eq("user_id", user.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isAdmin === null) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-xl font-semibold mb-2">Not an admin</h1>
        <p className="text-muted-foreground mb-4">Your account doesn't have admin access.</p>
        <Button onClick={signOut} variant="outline">Sign out</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/admin" className="flex items-center gap-2.5 font-semibold shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 grid place-items-center shadow-lg shadow-indigo-500/25">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:inline">SolveBot GPT</span>
          </Link>
          <nav className="flex items-center gap-1 bg-muted/40 rounded-full p-1 border border-border/50">
            <NavPill to="/admin" icon={Activity} label="لوحة التحكم" />
            <NavPill to="/broadcasts" icon={Megaphone} label="البث" />
            <NavPill to="/drips" icon={Droplets} label="حملات" />
            <NavPill to="/personas" icon={Bot} label="شخصيات" />
          </nav>
          <Button variant="ghost" size="sm" onClick={signOut} className="shrink-0">
            <LogOut className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">خروج</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <Tabs defaultValue="analytics">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
            <TabsTrigger value="chat">المحادثات</TabsTrigger>
            <TabsTrigger value="search">بحث وتصدير</TabsTrigger>
            <TabsTrigger value="config">إعدادات البوت</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6"><Analytics /></TabsContent>
          <TabsContent value="chat" className="mt-6"><ChatLog /></TabsContent>
          <TabsContent value="search" className="mt-6"><SearchExport /></TabsContent>
          <TabsContent value="config" className="mt-6"><BotConfig /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function NavPill({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link
      to={to}
      className="px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background/60 transition flex items-center gap-1.5"
      activeProps={{ className: "!bg-background !text-foreground shadow-sm" }}
      activeOptions={{ exact: true }}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </Link>
  );
}

function Analytics() {
  const [period, setPeriod] = useState<1 | 7 | 30 | 90>(7);

  const { data: rpcData } = useQuery({
    queryKey: ["bot-stats", period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_bot_stats", { period_days: period });
      if (error) throw error;
      return data as {
        bot: number; user: number; sessions: number;
        daily: { day: string; bot: number; user: number; sessions: number }[];
        hourly: { hour: string; bot: number; user: number; sessions: number }[];
      };
    },
    refetchInterval: 20000,
  });

  const { data: extra } = useQuery({
    queryKey: ["analytics-extra"],
    queryFn: async () => {
      const { data: msgs } = await supabase.from("messages").select("id,sender_type,message_text,response_time_ms,created_at,facebook_user_id")
        .order("created_at", { ascending: false }).limit(2000);
      const { data: fb } = await supabase.from("message_feedback").select("rating");
      return { msgs: (msgs ?? []) as Msg[], feedback: fb ?? [] };
    },
    refetchInterval: 20000,
  });

  const derived = useMemo(() => {
    const msgs = extra?.msgs ?? [];
    const feedback = extra?.feedback ?? [];
    const rts = msgs.filter(m => m.sender_type === "bot" && m.response_time_ms).map(m => m.response_time_ms as number);
    const avgRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
    const pos = feedback.filter((f: any) => f.rating === 1).length;
    const satisfaction = feedback.length ? Math.round((pos / feedback.length) * 100) : null;

    const wordFreq = new Map<string, number>();
    for (const m of msgs) {
      if (m.sender_type !== "user") continue;
      const txt = (m.message_text || "").trim().toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "");
      if (txt.length < 5) continue;
      const key = txt.split(/\s+/).slice(0, 5).join(" ");
      if (key.length < 5) continue;
      wordFreq.set(key, (wordFreq.get(key) ?? 0) + 1);
    }
    const topQuestions = Array.from(wordFreq.entries())
      .filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { avgRt, satisfaction, topQuestions };
  }, [extra]);

  const chart = useMemo(() => {
    if (period === 1) {
      const rows = rpcData?.hourly ?? [];
      const map = new Map(rows.map(r => [r.hour, r]));
      const out: { date: string; bot: number; user: number; sessions: number }[] = [];
      // Align to whole UTC hours matching the SQL series
      const nowUtc = new Date();
      const currentHourUtc = Date.UTC(
        nowUtc.getUTCFullYear(),
        nowUtc.getUTCMonth(),
        nowUtc.getUTCDate(),
        nowUtc.getUTCHours(),
      );
      for (let i = 23; i >= 0; i--) {
        const d = new Date(currentHourUtc - i * 3600_000);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}T${String(d.getUTCHours()).padStart(2, "0")}:00`;
        const row = map.get(key);
        out.push({
          date: `${String(d.getHours()).padStart(2, "0")}:00`,
          bot: Number(row?.bot ?? 0),
          user: Number(row?.user ?? 0),
          sessions: Number(row?.sessions ?? 0),
        });
      }
      return out;
    }
    const daily = rpcData?.daily ?? [];
    const map = new Map(daily.map(d => [d.day, d]));
    const out: { date: string; bot: number; user: number; sessions: number }[] = [];
    const nowUtc = new Date();
    const todayUtc = Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate());
    const weekdays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    for (let i = period - 1; i >= 0; i--) {
      const dateObj = new Date(todayUtc - i * 86400_000);
      const d = dateObj.toISOString().slice(0, 10);
      const row = map.get(d);
      const label = period === 7 ? weekdays[dateObj.getUTCDay()] : d.slice(5);
      out.push({ date: label, bot: Number(row?.bot ?? 0), user: Number(row?.user ?? 0), sessions: Number(row?.sessions ?? 0) });
    }
    return out;
  }, [rpcData, period]);


  const bot = rpcData?.bot ?? 0;
  const usr = rpcData?.user ?? 0;
  const sessions = rpcData?.sessions ?? 0;
  const periodLabel = period === 1 ? "آخر 24 ساعة" : period === 7 ? "آخر 7 أيام" : period === 30 ? "آخر 30 يوم" : "آخر 90 يوم";

  return (
    <div className="space-y-6" dir="rtl">
      {/* HERO SHOWCASE — screenshot-ready */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white p-6 md:p-8 shadow-2xl">
        <div className="absolute inset-0 opacity-40 pointer-events-none"
             style={{ backgroundImage: "radial-gradient(circle at 15% 0%, hsl(217 91% 60% / 0.45), transparent 45%), radial-gradient(circle at 85% 100%, hsl(280 91% 65% / 0.35), transparent 45%), radial-gradient(circle at 50% 50%, hsl(190 91% 60% / 0.15), transparent 60%)" }} />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
             style={{ backgroundImage: "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-300 mb-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SolveBot GPT · مباشر
              </div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">إحصائيات {periodLabel}</h2>
              <p className="text-sm text-slate-400 mt-1">لقطة دقيقة لأداء الروبوت في الوقت الفعلي</p>
            </div>
            <div className="flex items-center gap-1 bg-white/5 backdrop-blur-xl rounded-full p-1 border border-white/10 shadow-lg">
              {([1, 7, 30, 90] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${period === p ? "bg-white text-slate-950 shadow-md" : "text-slate-300 hover:text-white hover:bg-white/5"}`}>
                  {p === 1 ? "اليوم" : p === 7 ? "7 أيام" : p === 30 ? "30 يوم" : "90 يوم"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-8">
            <ShowcaseStat dotColor="#38bdf8" label="رسائل الروبوت" value={bot} />
            <ShowcaseStat dotColor="#fbbf24" label="رسائل المستخدم" value={usr} />
            <ShowcaseStat dotColor="#fb7185" label="الجلسات" value={sessions} />
          </div>

          <div className="mt-8 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBot" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gUser" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} interval={Math.max(0, Math.floor(chart.length / 10))} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, color: "#fff" }}
                  labelStyle={{ color: "#94a3b8" }} />
                <Area type="monotone" dataKey="bot" name="روبوت" stroke="#38bdf8" fill="url(#gBot)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="user" name="مستخدم" stroke="#fbbf24" fill="url(#gUser)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={MessageSquare} label={`الإجمالي · ${periodLabel}`} value={(bot + usr).toLocaleString()} tint="sky" />
        <StatCard icon={Users} label={`الجلسات · ${periodLabel}`} value={sessions.toLocaleString()} tint="violet" />
        <StatCard icon={Clock} label="متوسط الاستجابة" value={derived.avgRt ? `${(derived.avgRt / 1000).toFixed(1)}s` : "—"} tint="amber" />
        <StatCard icon={ThumbsUp} label="الرضا" value={derived.satisfaction !== null ? `${derived.satisfaction}%` : "—"} tint="emerald" />
      </div>

      <Card className="relative overflow-hidden p-6 md:p-7 border-border/60 bg-gradient-to-br from-card via-card to-muted/30 shadow-sm">
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500/10 to-sky-400/5 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold flex items-center gap-2 text-base">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 grid place-items-center shadow-sm shadow-indigo-500/30">
                <Activity className="w-4 h-4 text-white" />
              </span>
              أكثر الأسئلة تكراراً
            </h3>
            {derived.topQuestions.length > 0 && (
              <Badge variant="secondary" className="rounded-full">{derived.topQuestions.length}</Badge>
            )}
          </div>
          {derived.topQuestions.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">لا توجد بيانات كافية بعد.</div>
          ) : (
            <div className="space-y-2">
              {derived.topQuestions.map(([q, c], i) => {
                const max = derived.topQuestions[0][1];
                const pct = Math.max(8, Math.round((c / max) * 100));
                return (
                  <div key={q} className="group relative flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/60 hover:bg-background hover:border-border transition-all overflow-hidden">
                    <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-indigo-500/8 via-indigo-500/4 to-transparent transition-all group-hover:from-indigo-500/12"
                         style={{ width: `${pct}%` }} />
                    <div className="relative w-7 h-7 rounded-full bg-muted grid place-items-center text-[11px] font-bold text-muted-foreground shrink-0 tabular-nums">
                      {i + 1}
                    </div>
                    <span className="relative flex-1 truncate text-sm">{q}…</span>
                    <div className="relative flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-muted-foreground">تكرار</span>
                      <Badge className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/15 border-0 tabular-nums">{c}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function ShowcaseStat({ label, value, dotColor }: { dotColor: string; label: string; value: number }) {
  return (
    <div className="text-center md:text-right">
      <div className="flex items-center justify-center md:justify-end gap-2 mb-2">
        <span className="text-xs md:text-sm text-slate-300">{label}</span>
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: dotColor }} />
      </div>
      <div className="text-3xl md:text-5xl font-bold tracking-tight tabular-nums">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

const TINTS: Record<string, { bg: string; icon: string; ring: string }> = {
  sky:     { bg: "from-sky-500/10 to-sky-500/0",         icon: "text-sky-600 dark:text-sky-400 bg-sky-500/10",         ring: "hover:border-sky-500/40" },
  violet:  { bg: "from-violet-500/10 to-violet-500/0",   icon: "text-violet-600 dark:text-violet-400 bg-violet-500/10", ring: "hover:border-violet-500/40" },
  amber:   { bg: "from-amber-500/10 to-amber-500/0",     icon: "text-amber-600 dark:text-amber-400 bg-amber-500/10",   ring: "hover:border-amber-500/40" },
  emerald: { bg: "from-emerald-500/10 to-emerald-500/0", icon: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10", ring: "hover:border-emerald-500/40" },
};

function StatCard({ icon: Icon, label, value, tint = "sky" }: { icon: any; label: string; value: any; tint?: keyof typeof TINTS }) {
  const t = TINTS[tint];
  return (
    <Card className={`relative overflow-hidden p-5 border-border/60 bg-gradient-to-br ${t.bg} transition-all ${t.ring} hover:shadow-md hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-3 gap-2">
        <span className="text-xs md:text-sm text-muted-foreground leading-tight line-clamp-2">{label}</span>
        <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${t.icon}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="text-2xl md:text-3xl font-bold tracking-tight tabular-nums">{value}</div>
    </Card>
  );
}

type FbProfile = { facebook_user_id: string; name: string | null; first_name: string | null; profile_pic: string | null };

function dicebearUrl(seed: string) {
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&radius=50`;
}

function formatRelativeAr(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "الآن";
  const min = Math.floor(sec / 60);
  if (min < 60) return `منذ ${min} د`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `منذ ${hr} س`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "أمس";
  if (day < 7) return `منذ ${day} أيام`;
  return d.toLocaleDateString("ar", { day: "2-digit", month: "short" });
}

function formatFullAr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ar", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function Avatar({ profile, uid, size = 40 }: { profile?: FbProfile; uid: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const src = !imgError && profile?.profile_pic ? profile.profile_pic : dicebearUrl(uid);
  return (
    <div
      className="rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 shrink-0 overflow-hidden ring-2 ring-background shadow-sm"
      style={{ width: size, height: size }}
    >
      <img src={src} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
    </div>
  );
}

const AR_ADJ = ["الكريم","النبيل","اللامع","الذهبي","الفضي","الهادئ","السريع","الحكيم","الودود","الجريء","الأنيق","الساطع","الشجاع","المرح","الرائع","الفريد","الخفي","الأصيل","الحالم","المضيء","الطموح","الصبور","اللطيف","العطوف","الفطن","الودود","الرشيق","الباسم","الرصين","المبدع"];
const AR_NOUN = ["الصقر","النجم","القمر","الفارس","النسر","الأسد","الغزال","الفهد","البدر","الضياء","الشعاع","الفجر","السحاب","النهر","الجبل","البحر","الشروق","الغروب","الوردة","الياسمين","اللؤلؤ","الماس","الفينيق","التاج","الأمير","الرحالة","الحكيم","الشاعر","الرسام","الحالم"];
function hashCode(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h); }
function fakeNameFromUid(uid: string): string {
  const h = hashCode(uid);
  const h2 = hashCode(uid + "x");
  return `${AR_NOUN[h % AR_NOUN.length]} ${AR_ADJ[h2 % AR_ADJ.length]}`;
}

const LAST_SEEN_KEY = "solvebot:lastSeen";
function loadLastSeen(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LAST_SEEN_KEY) || "{}"); } catch { return {}; }
}
function saveLastSeen(map: Record<string, number>) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

function ChatLog() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, FbProfile>>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [lastSeen, setLastSeen] = useState<Record<string, number>>({});

  useEffect(() => { setLastSeen(loadLastSeen()); }, []);

  useEffect(() => {
    let mounted = true;
    supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => { if (mounted && data) setMessages(data as Msg[]); });

    const loadProfiles = async () => {
      const [{ data: fb }, { data: mem }] = await Promise.all([
        supabase.from("facebook_profiles").select("facebook_user_id,name,first_name,profile_pic"),
        supabase.from("user_memory").select("facebook_user_id,key,value").in("key", ["name", "first_name"]),
      ]);
      if (!mounted) return;
      const map: Record<string, FbProfile> = {};
      for (const p of (fb ?? []) as FbProfile[]) map[p.facebook_user_id] = p;
      for (const m of (mem ?? []) as { facebook_user_id: string; key: string; value: string }[]) {
        const cur = map[m.facebook_user_id] ?? { facebook_user_id: m.facebook_user_id, name: null, first_name: null, profile_pic: null };
        if (m.key === "name" && !cur.name) cur.name = m.value;
        if (m.key === "first_name" && !cur.first_name) cur.first_name = m.value;
        map[m.facebook_user_id] = cur;
      }
      setProfiles(map);
    };
    loadProfiles();

    const channel = supabase.channel("messages-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        setMessages((prev) => [payload.new as Msg, ...prev].slice(0, 500));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "facebook_profiles" }, (payload) => {
        const p = payload.new as FbProfile;
        if (p?.facebook_user_id) setProfiles((prev) => ({ ...prev, [p.facebook_user_id]: { ...prev[p.facebook_user_id], ...p } }));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_memory" }, (payload) => {
        const m = payload.new as { facebook_user_id: string; key: string; value: string };
        if (!m?.facebook_user_id) return;
        if (m.key !== "name" && m.key !== "first_name") return;
        setProfiles((prev) => {
          const cur = prev[m.facebook_user_id] ?? { facebook_user_id: m.facebook_user_id, name: null, first_name: null, profile_pic: null };
          return { ...prev, [m.facebook_user_id]: { ...cur, [m.key]: m.value } };
        });
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  const conversations = useMemo(() => {
    const map = new Map<string, { latest: Msg; unread: number; lastBotAt: number }>();
    const ordered = [...messages].reverse();
    for (const m of ordered) {
      const cur = map.get(m.facebook_user_id) ?? { latest: m, unread: 0, lastBotAt: 0 };
      cur.latest = m;
      const ts = new Date(m.created_at).getTime();
      if (m.sender_type === "bot") {
        cur.lastBotAt = ts;
        cur.unread = 0; // البوت رد → المحادثة تمت معالجتها
      } else if (m.sender_type === "user") {
        const seenAt = lastSeen[m.facebook_user_id] ?? 0;
        if (ts > seenAt && ts > cur.lastBotAt) cur.unread += 1;
      }
      map.set(m.facebook_user_id, cur);
    }
    return Array.from(map.entries())
      .map(([uid, v]) => ({ uid, latest: v.latest, unread: v.unread }))
      .sort((a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime());
  }, [messages, lastSeen]);

  const totalUnread = useMemo(() => conversations.reduce((s, c) => s + c.unread, 0), [conversations]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const base = "Dashboard · SolveBot GPT";
    document.title = totalUnread > 0 ? `(${totalUnread}) ${base}` : base;
  }, [totalUnread]);

  function openConversation(uid: string) {
    setSelectedUser(uid);
    const next = { ...lastSeen, [uid]: Date.now() };
    setLastSeen(next);
    saveLastSeen(next);
  }

  useEffect(() => {
    if (!selectedUser) return;
    const hasNewer = messages.some(m => m.facebook_user_id === selectedUser && new Date(m.created_at).getTime() > (lastSeen[selectedUser] ?? 0));
    if (hasNewer) {
      const next = { ...lastSeen, [selectedUser]: Date.now() };
      setLastSeen(next);
      saveLastSeen(next);
    }
  }, [messages, selectedUser, lastSeen]);

  const thread = useMemo(() => {
    if (!selectedUser) return [];
    return messages.filter(m => m.facebook_user_id === selectedUser).slice().reverse();
  }, [messages, selectedUser]);

  const selectedProfile = selectedUser ? profiles[selectedUser] : undefined;
  const nameFor = (uid: string) => profiles[uid]?.name || profiles[uid]?.first_name || fakeNameFromUid(uid);

  return (
    <Card className="p-0 overflow-hidden border-border/60">
      <div className="md:grid md:grid-cols-[320px_1fr] md:h-[640px]" dir="rtl">
        <div className={`border-b md:border-b-0 md:border-l bg-muted/30 flex-col ${selectedUser ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b font-semibold text-sm flex items-center gap-2 md:sticky md:top-0 bg-muted/30 backdrop-blur z-10">
            <span className={`inline-block w-2 h-2 rounded-full ${totalUnread > 0 ? "bg-rose-500" : "bg-emerald-500"} animate-pulse`} />
            <span className="flex-1">محادثات مباشرة · {conversations.length}</span>
            {totalUnread > 0 && (
              <Badge className="bg-rose-500 hover:bg-rose-500 text-white h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold">
                {totalUnread} جديد
              </Badge>
            )}
          </div>
          <div className="md:flex-1 md:overflow-y-auto">
            {conversations.length === 0 && <div className="p-6 text-sm text-muted-foreground">لا توجد رسائل بعد.</div>}
            {conversations.map(({ uid, latest, unread }) => {
              const hasUnread = unread > 0;
              const isUserLatest = latest.sender_type === "user";
              return (
                <button key={uid} onClick={() => openConversation(uid)}
                  className={`w-full text-right p-3 border-b border-border/40 hover:bg-accent transition flex items-center gap-3 relative ${selectedUser === uid ? "bg-accent" : ""} ${hasUnread ? "bg-rose-500/5" : ""}`}>
                  {hasUnread && <span className="absolute right-0 top-0 bottom-0 w-1 bg-rose-500" />}
                  <div className="relative">
                    <Avatar profile={profiles[uid]} uid={uid} size={44} />
                    {hasUnread && (
                      <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center ring-2 ring-background">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className={`text-sm truncate flex items-center gap-1.5 ${hasUnread ? "font-bold text-foreground" : "font-medium"}`}>
                        {nameFor(uid)}
                        {hasUnread && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />}
                      </div>
                      <div className={`text-[10px] shrink-0 ${hasUnread ? "text-rose-500 font-semibold" : "text-muted-foreground"}`} title={formatFullAr(latest.created_at)}>
                        {formatRelativeAr(latest.created_at)}
                      </div>
                    </div>
                    <div className={`text-xs truncate mt-0.5 flex items-center gap-1 ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {isUserLatest ? (
                        <span className="text-emerald-600 dark:text-emerald-400 shrink-0">↩</span>
                      ) : (
                        <span className="shrink-0">🤖</span>
                      )}
                      <span className="truncate">{latest.message_text}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className={`flex-col ${selectedUser ? "flex" : "hidden md:flex"}`}>
          {!selectedUser ? (
            <div className="flex-1 grid place-items-center text-muted-foreground text-sm p-10">اختر محادثة لعرضها</div>
          ) : (
            <>
              <div className="border-b p-3 flex items-center gap-3 bg-background/60 sticky top-0 z-10 backdrop-blur">
                <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setSelectedUser(null)} aria-label="رجوع">
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Avatar profile={selectedProfile} uid={selectedUser} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{nameFor(selectedUser)}</div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate">{selectedUser}</div>
                </div>
              </div>
              <div className="md:flex-1 md:overflow-y-auto p-4 md:p-6">
                <div className="space-y-3">
                  {thread.map(m => {
                    const isBot = m.sender_type === "bot";
                    return (
                      <div key={m.id} className={`flex items-end gap-2 ${isBot ? "flex-row-reverse" : "flex-row"}`}>
                        {!isBot && <Avatar profile={selectedProfile} uid={selectedUser} size={28} />}
                        {isBot && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 grid place-items-center text-white shrink-0">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                          isBot ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                        }`}>
                          {m.message_text}
                          <div className="text-[10px] opacity-60 mt-1">
                            {formatFullAr(m.created_at)}
                            {m.response_time_ms ? ` · ${(m.response_time_ms / 1000).toFixed(1)}s` : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function SearchExport() {
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState("");
  const [results, setResults] = useState<Msg[]>([]);
  const [searching, setSearching] = useState(false);

  async function runSearch() {
    setSearching(true);
    let query = supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(500);
    if (userId.trim()) query = query.eq("facebook_user_id", userId.trim());
    if (q.trim()) query = query.ilike("message_text", `%${q.trim()}%`);
    const { data, error } = await query;
    setSearching(false);
    if (error) return toast.error(error.message);
    setResults((data ?? []) as Msg[]);
  }

  function exportCsv(rows: Msg[], filename: string) {
    if (rows.length === 0) return toast.error("لا توجد رسائل للتصدير");
    const header = ["created_at", "facebook_user_id", "sender_type", "page_id", "response_time_ms", "message_text"];
    const escape = (v: any) => {
      const s = v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""').replace(/\n/g, "\\n")}"`;
    };
    const csv = [header.join(","), ...rows.map(r => header.map(h => escape((r as any)[h])).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function exportAll() {
    toast.info("جارٍ تجميع كل الرسائل…");
    const all: Msg[] = [];
    let from = 0; const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase.from("messages").select("*")
        .order("created_at", { ascending: false }).range(from, from + pageSize - 1);
      if (error) { toast.error(error.message); return; }
      if (!data?.length) break;
      all.push(...(data as Msg[]));
      if (data.length < pageSize) break;
      from += pageSize;
      if (all.length >= 50000) break;
    }
    exportCsv(all, `messages-all-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <div className="grid md:grid-cols-[1fr_240px_auto_auto] gap-2">
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث في نص الرسائل (keyword)…"
            onKeyDown={e => { if (e.key === "Enter") runSearch(); }} />
          <Input value={userId} onChange={e => setUserId(e.target.value)} placeholder="Facebook user ID (اختياري)"
            onKeyDown={e => { if (e.key === "Enter") runSearch(); }} />
          <Button onClick={runSearch} disabled={searching}>
            <Search className="w-4 h-4 mr-2" />{searching ? "…" : "بحث"}
          </Button>
          <Button variant="outline" onClick={exportAll}>
            <Download className="w-4 h-4 mr-2" />CSV كامل
          </Button>
        </div>
        {results.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{results.length} نتيجة</span>
            <Button size="sm" variant="outline" onClick={() => exportCsv(results, `messages-search-${Date.now()}.csv`)}>
              <Download className="w-3 h-3 mr-2" />تصدير النتائج
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-0 overflow-hidden">
        {results.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">ابحث بـ keyword أو user ID لعرض النتائج.</div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto divide-y">
            {results.map(m => (
              <div key={m.id} className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Badge variant={m.sender_type === "bot" ? "default" : "secondary"}>{m.sender_type}</Badge>
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                  <span className="font-mono">· {m.facebook_user_id.slice(0, 14)}…</span>
                </div>
                <div className="text-sm whitespace-pre-wrap">{m.message_text}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

type BotSettings = {
  id: string;
  system_prompt: string;
  is_active: boolean;
  answer_length: "short" | "normal" | "long";
  tone: "professional" | "gentle" | "direct" | "empathetic" | "friendly";
  allow_customer_length_config: boolean;
};

const LENGTH_OPTIONS: { value: BotSettings["answer_length"]; label: string; desc: string }[] = [
  { value: "short", label: "قصير", desc: "ملخص موجز، أقصر من التنسيق العادي." },
  { value: "normal", label: "طبيعي", desc: "التنسيق القياسي المتوازن." },
  { value: "long", label: "طويل", desc: "أكثر تفصيلاً وشرحاً من العادي." },
];

const TONE_OPTIONS: { value: BotSettings["tone"]; label: string; desc: string }[] = [
  { value: "professional", label: "محترف", desc: "لهجة واضحة ومهذبة ومهنية — مناسبة لمعظم الحالات." },
  { value: "gentle", label: "لطيف", desc: "نبرة هادئة ومهذبة تجعل الردود تبدو لطيفة ومطمئنة." },
  { value: "direct", label: "مباشر", desc: "ردود قصيرة ومباشرة في صلب الموضوع، بدون حشو." },
  { value: "empathetic", label: "متعاطف", desc: "يُظهر الرعاية والفهم العاطفي فيشعر المستخدم بأنه مسموع." },
  { value: "friendly", label: "ودّي", desc: "دفء وود يجعل المحادثة طبيعية وشخصية." },
];

function BotConfig() {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [mistralKeys, setMistralKeys] = useState<string[]>([]);
  const [mistralConfigId, setMistralConfigId] = useState<string | null>(null);
  const [savingKeys, setSavingKeys] = useState(false);
  const [visibleIdx, setVisibleIdx] = useState<Record<number, boolean>>({});
  const webhookUrl = getWebhookUrl();

  useEffect(() => {
    supabase.from("bot_settings").select("*").limit(1).maybeSingle()
      .then(({ data }) => { if (data) setSettings(data as BotSettings); });
    (supabase.from("app_config" as any) as any).select("id, mistral_api_key, mistral_api_keys").limit(1).maybeSingle()
      .then(({ data }: any) => {
        if (!data) return;
        setMistralConfigId(data.id);
        const list: string[] = [];
        if (Array.isArray(data.mistral_api_keys)) {
          for (const k of data.mistral_api_keys) {
            if (typeof k === "string" && k.trim()) list.push(k.trim());
          }
        }
        if (list.length === 0 && typeof data.mistral_api_key === "string" && data.mistral_api_key.trim()) {
          list.push(data.mistral_api_key.trim());
        }
        if (list.length === 0) list.push("");
        setMistralKeys(list);
      });
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from("bot_settings")
      .update({
        system_prompt: settings.system_prompt,
        is_active: settings.is_active,
        answer_length: settings.answer_length,
        tone: settings.tone,
        allow_customer_length_config: settings.allow_customer_length_config,
      })
      .eq("id", settings.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ الإعدادات — البوت يعمل بها فوراً");
  }

  async function saveMistralKeys() {
    const cleaned = mistralKeys.map(k => k.trim()).filter(k => k.length > 0);
    setSavingKeys(true);
    const payload = {
      mistral_api_keys: cleaned,
      mistral_api_key: cleaned[0] ?? null,
      updated_at: new Date().toISOString(),
    };
    let error: any = null;
    if (mistralConfigId) {
      const res = await (supabase.from("app_config" as any) as any)
        .update(payload).eq("id", mistralConfigId);
      error = res.error;
    } else {
      const res = await (supabase.from("app_config" as any) as any)
        .insert(payload).select("id").maybeSingle();
      error = res.error;
      if (res.data?.id) setMistralConfigId(res.data.id);
    }
    setSavingKeys(false);
    if (error) return toast.error(error.message);
    toast.success(`تم حفظ ${cleaned.length} مفتاح — يتناوب البوت بينها فوراً`);
  }

  if (!settings) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="p-6 md:col-span-2 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base">AI Auto-reply</Label>
            <Switch checked={settings.is_active} onCheckedChange={(v) => setSettings({ ...settings, is_active: v })} />
          </div>
          <p className="text-sm text-muted-foreground">
            {settings.is_active ? "On — Mistral AI replies automatically." : "Off — messages logged, no replies (manual)."}
          </p>
        </div>

        <div className="pt-6 border-t space-y-3">
          <div>
            <Label className="text-base">طول إجابة الروبوت الافتراضي</Label>
            <p className="text-sm text-muted-foreground mt-1">يُطبَّق فوراً على كل الردود التلقائية.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {LENGTH_OPTIONS.map(opt => {
              const active = settings.answer_length === opt.value;
              return (
                <button key={opt.value} type="button"
                  onClick={() => setSettings({ ...settings, answer_length: opt.value })}
                  className={`text-right p-4 rounded-xl border transition-all ${active
                    ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30 shadow-sm"
                    : "border-border/60 hover:border-border hover:bg-muted/40"}`}>
                  <div className="font-semibold mb-1 flex items-center justify-between">
                    <span>{opt.label}</span>
                    {active && <Badge className="text-[10px]">مُفعّل</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 border border-border/60 mt-2">
            <div>
              <Label className="text-sm">السماح للعميل بتكوين طول إجابة الروبوت</Label>
              <p className="text-xs text-muted-foreground mt-1">
                عند التفعيل، يمكن للعميل أن يطلب من الروبوت تغيير طول الردود ("اجعل ردودك أقصر/أطول") ويلتزم بذلك. عند التعطيل، يُستخدم الإعداد الافتراضي أعلاه فقط.
              </p>
            </div>
            <Switch
              checked={settings.allow_customer_length_config}
              onCheckedChange={(v) => setSettings({ ...settings, allow_customer_length_config: v })}
            />
          </div>
        </div>

        <div className="pt-6 border-t space-y-3">
          <div>
            <Label className="text-base">نغمة الروبوت الافتراضية</Label>
            <p className="text-sm text-muted-foreground mt-1">تحدد أسلوب البوت في كل الردود.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TONE_OPTIONS.map(opt => {
              const active = settings.tone === opt.value;
              return (
                <button key={opt.value} type="button"
                  onClick={() => setSettings({ ...settings, tone: opt.value })}
                  className={`text-right p-4 rounded-xl border transition-all ${active
                    ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-sm"
                    : "border-border/60 hover:border-border hover:bg-muted/40"}`}>
                  <div className="font-semibold mb-1 flex items-center justify-between">
                    <span>{opt.label}</span>
                    {active && <Badge className="text-[10px]" variant="secondary">مُفعّل</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t">
          <Label htmlFor="prompt" className="text-base">Default System prompt</Label>
          <p className="text-sm text-muted-foreground mb-3">Fallback persona used when no custom Persona matches.</p>
          <Textarea id="prompt" rows={10} value={settings.system_prompt}
            onChange={e => setSettings({ ...settings, system_prompt: e.target.value })}
            className="font-mono text-sm" />
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}</Button>
      </Card>

      <div className="space-y-6">
      <Card className="p-6 space-y-4 h-fit">
        <div>
          <h3 className="font-semibold mb-1">مفاتيح Mistral API</h3>
          <p className="text-xs text-muted-foreground">
            أضف عدة مفاتيح ليتم التناوب بينها تلقائياً وتفادي الضغط على مفتاح واحد. تُطبَّق فوراً على البوت.
          </p>
        </div>
        <div className="space-y-2">
          {mistralKeys.map((k, i) => (
            <div key={i} className="space-y-1">
              <Label className="text-xs">مفتاح #{i + 1}</Label>
              <div className="flex gap-2">
                <Input
                  type={visibleIdx[i] ? "text" : "password"}
                  value={k}
                  onChange={(e) => {
                    const next = [...mistralKeys];
                    next[i] = e.target.value;
                    setMistralKeys(next);
                  }}
                  placeholder="…"
                  className="font-mono text-xs"
                  autoComplete="off"
                />
                <Button size="sm" variant="outline" type="button"
                  onClick={() => setVisibleIdx({ ...visibleIdx, [i]: !visibleIdx[i] })}>
                  {visibleIdx[i] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <Button size="sm" variant="outline" type="button"
                  disabled={mistralKeys.length <= 1}
                  onClick={() => setMistralKeys(mistralKeys.filter((_, j) => j !== i))}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" type="button" className="w-full"
            onClick={() => setMistralKeys([...mistralKeys, ""])}>
            <Plus className="w-3 h-3 mr-1" /> إضافة مفتاح آخر
          </Button>
          <Button size="sm" onClick={saveMistralKeys} disabled={savingKeys} className="w-full">
            {savingKeys ? "جارٍ الحفظ…" : "حفظ المفاتيح"}
          </Button>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            تُخزَّن المفاتيح بأمان في قاعدة البيانات ومحمية بصلاحيات المشرف فقط. البوت يتناوب بينها تلقائياً على كل طلب.
          </p>
        </div>
      </Card>

      <Card className="p-6 space-y-4 h-fit">
        <div>
          <h3 className="font-semibold mb-1">Facebook Webhook setup</h3>
          <p className="text-xs text-muted-foreground">Meta for Developers → App → Messenger → Webhooks:</p>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <Label className="text-xs">Callback URL</Label>
            <div className="flex gap-2 mt-1">
              <code className="text-xs p-2 bg-muted rounded flex-1 break-all">{webhookUrl}</code>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Copied"); }}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Verify Token</Label>
            <div className="text-xs text-muted-foreground mt-1">Stored as <Badge variant="secondary">FB_VERIFY_TOKEN</Badge>.</div>
          </div>
          <div>
            <Label className="text-xs">Subscribe to events</Label>
            <p className="text-xs text-muted-foreground mt-1"><code>messages</code>, <code>messaging_postbacks</code></p>
          </div>
        </div>
        <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
          <div>✓ <Badge variant="secondary">MISTRAL_API_KEY</Badge></div>
          <div>✓ <Badge variant="secondary">FB_PAGE_ACCESS_TOKEN</Badge></div>
          <div>✓ <Badge variant="secondary">FB_VERIFY_TOKEN</Badge></div>
        </div>
      </Card>
      </div>
    </div>
  );
}
