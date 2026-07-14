import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bot, BarChart3, Zap, Shield, Sparkles, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SolveBot GPT — روبوت ماسنجر ذكي بتقنية Mistral AI" },
      { name: "description", content: "روبوت ذكاء اصطناعي بتقنية Mistral AI للرد على رسائل فيسبوك ماسنجر ٢٤/٧ مع لوحة إحصائيات مباشرة." },
      { property: "og:title", content: "SolveBot GPT — روبوت ماسنجر ذكي" },
      { property: "og:description", content: "ردود آلية بتقنية Mistral AI مع لوحة تحكم مباشرة." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative" dir="rtl">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none opacity-60"
           style={{ backgroundImage: "radial-gradient(ellipse 60% 40% at 20% 0%, hsl(217 91% 60% / 0.35), transparent), radial-gradient(ellipse 60% 40% at 80% 20%, hsl(280 91% 65% / 0.25), transparent), radial-gradient(ellipse 50% 30% at 50% 100%, hsl(190 91% 60% / 0.18), transparent)" }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
           style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "56px 56px" }} />

      <div className="relative">
        <header className="border-b border-white/5 backdrop-blur-xl sticky top-0 bg-slate-950/70 z-10">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-semibold">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 grid place-items-center shadow-lg shadow-indigo-500/30">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="text-white">SolveBot <span className="text-slate-400 font-normal">GPT</span></span>
            </div>
            <Link to="/auth">
              <Button size="sm" className="bg-white text-slate-950 hover:bg-slate-100 rounded-full font-medium">
                دخول المسؤول <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              </Button>
            </Link>
          </div>
        </header>

        <section className="max-w-6xl mx-auto px-6 pt-28 pb-24 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 mb-8">
            <Sparkles className="w-3 h-3 text-amber-400" /> مدعوم بـ Mistral AI · Voxtral · OCR
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.02] max-w-4xl mx-auto bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent">
            ردود ذكية على ماسنجر.<br />بلمسة إنسانية.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mt-8 max-w-2xl mx-auto leading-relaxed">
            اربط صفحتك مرة واحدة. الروبوت يرد على عملائك فوراً بالنص والصوت — أنت تراقب وتتحكم متى شئت.
          </p>
          <div className="mt-10 flex gap-3 justify-center flex-wrap">
            <Link to="/auth">
              <Button size="lg" className="bg-white text-slate-950 hover:bg-slate-100 rounded-full px-8 font-semibold h-12">
                ابدأ مجاناً
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                كيف يعمل
              </Button>
            </a>
          </div>
        </section>

        <section id="features" className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-4">
          {[
            { icon: MessageSquare, title: "سجل مباشر", body: "كل محادثة تظهر في لوحتك فوراً، مجمّعة حسب العميل." },
            { icon: Bot, title: "شخصية قابلة للتخصيص", body: "عدّل نبرة الروبوت لتناسب علامتك التجارية. شغّل/أوقف بلمسة." },
            { icon: BarChart3, title: "إحصائيات دقيقة", body: "رسائل اليوم، الأسبوع، الشهر — كلها في مكان واحد." },
            { icon: Zap, title: "رد فوري ٢٤/٧", body: "ردود بالنص والصوت خلال ثوانٍ بلغة عميلك." },
            { icon: Shield, title: "أمان افتراضي", body: "المفاتيح محفوظة في متغيرات مشفّرة، لا في الكود." },
            { icon: Sparkles, title: "تدخل يدوي", body: "أوقف الروبوت بلمسة حين تحتاج التدخل الإنساني." },
          ].map((f) => (
            <div key={f.title} className="group relative p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/20 transition">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-white/10 grid place-items-center mb-4 group-hover:scale-110 transition">
                <f.icon className="w-4 h-4 text-sky-300" />
              </div>
              <h3 className="font-semibold mb-1.5 text-white">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </section>

        <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
          مبني على Lovable · Mistral AI · Supabase
        </footer>
      </div>
    </div>
  );
}
