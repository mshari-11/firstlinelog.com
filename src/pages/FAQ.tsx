/**
 * صفحة الأسئلة الشائعة - FAQ
 * FirstLine Logistics
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, Search, MessageCircle, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const faqCategories = [
  { id: "general", label: "عام", icon: HelpCircle },
  { id: "drivers", label: "للسائقين", icon: MessageCircle },
  { id: "platforms", label: "للمنصات", icon: Phone },
  { id: "investors", label: "للمستثمرين", icon: Mail },
];

const faqData = [
  {
    category: "general",
    question: "ما هي فيرست لاين لوجستيكس؟",
    answer: "فيرست لاين لوجستيكس هي مشغل لوجستي سعودي للطرف الثالث (3PL) متخصص في خدمات التوصيل لمنصات التوصيل الرقمية مثل هنقرستيشن وجاهز ومرسول. نقدم خدمات إدارة الأساطيل والتنفيذ الميداني بكفاءة مؤسسية عبر أكثر من 18 مدينة سعودية.",
  },
  {
    category: "general",
    question: "في أي مدن تعمل فيرست لاين؟",
    answer: "نعمل حالياً في أكثر من 18 مدينة سعودية تشمل جدة، الرياض، مكة المكرمة، المدينة المنورة، الدمام، الخبر، الطائف، تبوك، أبها، جازان وغيرها. ونعمل على التوسع المستمر لتغطية جميع مناطق المملكة.",
  },
  {
    category: "general",
    question: "ما المنصات التي تعملون معها؟",
    answer: "نعمل مع أكبر منصات التوصيل في المملكة بما في ذلك هنقرستيشن، جاهز، مرسول، نون فود، كريم، وغيرها. كما نرحب بالشراكات مع منصات جديدة.",
  },
  {
    category: "drivers",
    question: "كيف يمكنني التسجيل كقائد مركبة؟",
    answer: "يمكنك التسجيل عبر صفحة 'انضم إلينا' على موقعنا. ستحتاج لتقديم رخصة قيادة سارية المفعول، استمارة مركبة، تأمين ساري، وهوية وطنية أو إقامة. يتم مراجعة الطلبات خلال 24-48 ساعة.",
  },
  {
    category: "drivers",
    question: "ما هي المتطلبات للانضمام كسائق؟",
    answer: "المتطلبات الأساسية تشمل: العمر 18 سنة فأعلى، رخصة قيادة سارية، مركبة بحالة جيدة (موديل 2018 فأحدث)، تأمين شامل ساري، فحص دوري ساري، وهوية وطنية أو إقامة سارية.",
  },
  {
    category: "drivers",
    question: "كيف يتم حساب الأرباح؟",
    answer: "تُحسب الأرباح بناءً على عدد الطلبات المنجزة ومسافة التوصيل. بالإضافة لذلك، هناك حوافز ومكافآت على الأداء المتميز وساعات الذروة. يتم تحويل الأرباح مرتين شهرياً عبر التحويل البنكي.",
  },
  {
    category: "drivers",
    question: "هل يمكنني العمل بدوام جزئي؟",
    answer: "نعم، نوفر مرونة كاملة في ساعات العمل. يمكنك اختيار الأوقات المناسبة لك والعمل بدوام كامل أو جزئي حسب رغبتك.",
  },
  {
    category: "platforms",
    question: "كيف يمكن لمنصتنا الشراكة مع فيرست لاين؟",
    answer: "نرحب بالشراكات مع منصات التوصيل. يمكنكم التواصل معنا عبر صفحة الاتصال أو مباشرة عبر البريد الإلكتروني info@firstlinelog.com. نقدم حلول مخصصة تناسب احتياجات كل منصة.",
  },
  {
    category: "platforms",
    question: "ما المزايا التي تقدمونها للمنصات الشريكة؟",
    answer: "نقدم أسطول مُدار بالكامل مع معايير جودة عالية، تغطية واسعة لأكثر من 18 مدينة، نظام تتبع وإدارة متطور، معدل تسليم يتجاوز 94%، ودعم فني على مدار الساعة.",
  },
  {
    category: "investors",
    question: "هل تقبلون استثمارات جديدة؟",
    answer: "نعم، نرحب بالمستثمرين المهتمين بقطاع اللوجستيات والتوصيل في المملكة. يمكنكم مراجعة صفحة علاقات المستثمرين للمزيد من التفاصيل أو التواصل مباشرة مع فريق علاقات المستثمرين.",
  },
  {
    category: "investors",
    question: "ما حجم سوق التوصيل في المملكة؟",
    answer: "يُقدر سوق التوصيل في المملكة بأكثر من 20 مليار ريال سنوياً مع نمو سنوي يتجاوز 25%. يدعم هذا النمو التحول الرقمي المتسارع ورؤية المملكة 2030.",
  },
];

function FAQItem({ faq, isOpen, onToggle }: { faq: typeof faqData[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-right hover:bg-muted/30 transition-colors"
      >
        <span className="font-bold text-sm flex-1">{faq.question}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 mr-4 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filtered = faqData.filter((faq) => {
    const matchCategory = faq.category === activeCategory;
    const matchSearch = search === "" || faq.question.includes(search) || faq.answer.includes(search);
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="outline" className="mb-6 px-4 py-1.5 font-bold">
              <HelpCircle className="w-3.5 h-3.5 ml-2" />
              مركز المساعدة
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black mb-4">الأسئلة الشائعة</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              إجابات على أكثر الأسئلة شيوعاً حول خدماتنا وعملياتنا
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-lg mx-auto mt-8">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن سؤال..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-12 h-12 rounded-xl text-base"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {faqCategories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setOpenIndex(0);
                }}
                className="rounded-full px-6 gap-2"
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </Button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="max-w-3xl mx-auto space-y-3">
            {filtered.map((faq, i) => (
              <FAQItem
                key={`${faq.category}-${i}`}
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد نتائج مطابقة لبحثك</p>
              </div>
            )}
          </div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-16">
            <Card className="max-w-xl mx-auto border-primary/20 bg-primary/5">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">لم تجد إجابة سؤالك؟</h3>
                <p className="text-muted-foreground text-sm mb-6">تواصل مع فريقنا وسنرد عليك في أقرب وقت</p>
                <Button asChild>
                  <Link to={ROUTE_PATHS.CONTACT}>تواصل معنا</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
