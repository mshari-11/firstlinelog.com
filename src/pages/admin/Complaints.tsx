/**
 * صفحة الشكاوى والطلبات
 */
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  MessageSquare, Search, AlertCircle, CheckCircle2,
  Clock, XCircle, ChevronDown, Send, User, Tag
} from "lucide-react";

interface Complaint {
  id: string;
  type: "complaint" | "request" | "suggestion";
  title: string;
  description: string;
  submitted_by: string;
  role: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "high" | "medium" | "low";
  created_at: string;
  assigned_to?: string;
}

const typeMap: Record<string, { label: string; color: string }> = {
  complaint: { label: "شكوى", color: "text-red-400 bg-red-500/10" },
  request: { label: "طلب", color: "text-blue-400 bg-blue-500/10" },
  suggestion: { label: "اقتراح", color: "text-green-400 bg-green-500/10" },
};

const statusMap: Record<string, { label: string; color: string }> = {
  open: { label: "مفتوح", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  in_progress: { label: "قيد المعالجة", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  resolved: { label: "تم الحل", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  closed: { label: "مغلق", color: "text-blue-300/60 bg-blue-900/50 border-slate-600/20" },
};

const priorityMap: Record<string, { label: string; color: string }> = {
  high: { label: "عالية", color: "text-red-400" },
  medium: { label: "متوسطة", color: "text-yellow-400" },
  low: { label: "منخفضة", color: "text-green-400" },
};

const mockComplaints: Complaint[] = [
  { id: "C-001", type: "complaint", title: "تأخر في صرف الراتب", description: "لم يتم صرف راتب شهر يناير حتى الآن رغم مرور 15 يوم على الموعد المحدد", submitted_by: "أحمد محمد السالم", role: "مندوب", status: "open", priority: "high", created_at: "منذ ساعتين" },
  { id: "C-002", type: "request", title: "طلب إجازة أسبوع", description: "أطلب إجازة من 20 إلى 27 فبراير لظروف عائلية", submitted_by: "خالد العمري", role: "مندوب", status: "in_progress", priority: "medium", created_at: "منذ 5 ساعات", assigned_to: "قسم الموارد البشرية" },
  { id: "C-003", type: "complaint", title: "مشكلة في التطبيق", description: "التطبيق يتوقف عن العمل عند محاولة تأكيد التسليم", submitted_by: "فهد الغامدي", role: "مندوب", status: "in_progress", priority: "high", created_at: "منذ يوم", assigned_to: "فريق التقنية" },
  { id: "C-004", type: "suggestion", title: "اقتراح تحسين المسارات", description: "اقترح إضافة خاصية تحسين المسارات لتوفير الوقت والوقود", submitted_by: "سعد الزهراني", role: "مندوب", status: "resolved", priority: "low", created_at: "منذ 3 أيام" },
  { id: "C-005", type: "complaint", title: "خصم راتب غير مبرر", description: "تم خصم مبلغ من راتبي دون إشعار أو توضيح السبب", submitted_by: "عمر الشمري", role: "مندوب", status: "open", priority: "high", created_at: "منذ 4 أيام" },
];

export default function AdminComplaints() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [reply, setReply] = useState("");
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);

  useEffect(() => {
    async function fetchComplaints() {
      const { data, error } = await supabase
        .from("complaints_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map((c: any) => ({
          id: c.id,
          type: c.request_type || "complaint",
          title: c.subject || "بدون عنوان",
          description: c.description || "",
          courier_name: c.submitted_by || "غير محدد",
          status: c.status || "open",
          priority: c.priority || "medium",
          created_at: new Date(c.created_at).toLocaleDateString("ar-SA"),
          response: c.resolution_notes || "",
        }));
        setComplaints(mapped);
      }
    }
    fetchComplaints();
  }, []);

  const filtered = complaints.filter((c) => {
    const matchSearch = c.title.includes(search) || c.submitted_by.includes(search);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchType = typeFilter === "all" || c.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const stats = {
    open: complaints.filter((c) => c.status === "open").length,
    inProgress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* الترويسة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الشكاوى والطلبات</h1>
          <p className="text-blue-300/60 text-sm mt-0.5">إدارة شكاوى وطلبات المناديب والموظفين</p>
        </div>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "مفتوحة", value: stats.open, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
          { label: "قيد المعالجة", value: stats.inProgress, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "تم الحل", value: stats.resolved, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-2xl p-4 text-center ${s.bg}`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-blue-300/60 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* فلترة */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الشكاوى..."
            className="w-full bg-blue-950/60 border border-blue-700/30 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-blue-950/60 border border-blue-700/30 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="all">كل الأنواع</option>
          <option value="complaint">شكاوى</option>
          <option value="request">طلبات</option>
          <option value="suggestion">اقتراحات</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-blue-950/60 border border-blue-700/30 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="all">كل الحالات</option>
          <option value="open">مفتوح</option>
          <option value="in_progress">قيد المعالجة</option>
          <option value="resolved">تم الحل</option>
          <option value="closed">مغلق</option>
        </select>
      </div>

      {/* القائمة والتفاصيل */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* القائمة */}
        <div className="space-y-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              className={`bg-slate-800/40 border rounded-2xl p-4 cursor-pointer transition-all hover:border-slate-600 ${
                selected?.id === c.id ? "border-cyan-500/40 bg-orange-500/5" : "border-blue-700/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${typeMap[c.type].color}`}>
                      {typeMap[c.type].label}
                    </span>
                    <span className={`text-xs font-medium ${priorityMap[c.priority].color}`}>
                      ● {priorityMap[c.priority].label}
                    </span>
                  </div>
                  <p className="text-slate-200 text-sm font-medium leading-snug">{c.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <User size={11} className="text-slate-500" />
                    <span className="text-slate-500 text-xs">{c.submitted_by}</span>
                    <span className="text-slate-700">·</span>
                    <span className="text-slate-600 text-xs">{c.created_at}</span>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium shrink-0 ${statusMap[c.status].color}`}>
                  {statusMap[c.status].label}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">لا توجد شكاوى</p>
            </div>
          )}
        </div>

        {/* التفاصيل */}
        {selected ? (
          <div className="bg-slate-800/40 border border-blue-700/30 rounded-2xl p-5 h-fit sticky top-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-slate-500 text-xs font-mono">{selected.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${typeMap[selected.type].color}`}>
                    {typeMap[selected.type].label}
                  </span>
                </div>
                <h3 className="text-white font-semibold">{selected.title}</h3>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${statusMap[selected.status].color}`}>
                {statusMap[selected.status].label}
              </span>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
              <p className="text-blue-100 text-sm leading-relaxed">{selected.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
              <div>
                <p className="text-slate-500 mb-0.5">مقدم من</p>
                <p className="text-slate-200 font-medium">{selected.submitted_by}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-0.5">الدور</p>
                <p className="text-slate-200">{selected.role}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-0.5">الأولوية</p>
                <p className={`font-medium ${priorityMap[selected.priority].color}`}>{priorityMap[selected.priority].label}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-0.5">التاريخ</p>
                <p className="text-slate-200">{selected.created_at}</p>
              </div>
              {selected.assigned_to && (
                <div className="col-span-2">
                  <p className="text-slate-500 mb-0.5">مُحال إلى</p>
                  <p className="text-slate-200">{selected.assigned_to}</p>
                </div>
              )}
            </div>

            {/* الرد */}
            <div className="space-y-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="اكتب ردك هنا..."
                rows={3}
                className="w-full bg-slate-900/60 border border-blue-700/30 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              />
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-2 rounded-xl text-sm font-medium transition-colors">
                  <Send size={14} />
                  إرسال الرد
                </button>
                <button className="px-4 py-2 bg-green-500/15 text-green-400 text-sm rounded-xl hover:bg-green-500/25 transition-colors">
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/20 border border-slate-700/30 rounded-2xl flex items-center justify-center h-64 text-slate-600">
            <div className="text-center">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">اختر شكوى لعرض التفاصيل</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
