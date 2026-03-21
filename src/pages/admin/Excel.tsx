/**
 * صفحة استيراد Excel
 */
import { useState, useRef } from "react";
import {
  FileSpreadsheet, Upload, CheckCircle2, XCircle,
  Clock, AlertCircle, Download, Eye, RefreshCw,
  ChevronDown, FileText, Trash2
} from "lucide-react";

interface ImportHistory {
  id: string;
  filename: string;
  type: "salaries" | "orders" | "couriers";
  rows: number;
  status: "success" | "failed" | "pending";
  errors?: number;
  uploaded_by: string;
  created_at: string;
}

const typeMap: Record<string, { label: string; color: string }> = {
  salaries: { label: "رواتب", color: "text-green-400 bg-green-500/10" },
  orders: { label: "طلبات", color: "text-blue-400 bg-blue-500/10" },
  couriers: { label: "مناديب", color: "text-purple-400 bg-purple-500/10" },
};

const statusMap: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  success: { label: "ناجح", color: "text-green-400", icon: CheckCircle2 },
  failed: { label: "فشل", color: "text-red-400", icon: XCircle },
  pending: { label: "قيد المراجعة", color: "text-yellow-400", icon: Clock },
};

const mockHistory: ImportHistory[] = [
  { id: "1", filename: "رواتب_فبراير_2025.xlsx", type: "salaries", rows: 47, status: "pending", uploaded_by: "محمد الشمري", created_at: "منذ 2 ساعة" },
  { id: "2", filename: "طلبات_يناير_2025.xlsx", type: "orders", rows: 1234, status: "success", uploaded_by: "أحمد العمري", created_at: "منذ يوم" },
  { id: "3", filename: "مناديب_جدد_2025.xlsx", type: "couriers", rows: 12, status: "success", uploaded_by: "خالد السالم", created_at: "منذ 3 أيام" },
  { id: "4", filename: "رواتب_يناير_2025.xlsx", type: "salaries", rows: 47, status: "failed", errors: 3, uploaded_by: "محمد الشمري", created_at: "منذ 5 أيام" },
];

export default function AdminExcel() {
  const [dragging, setDragging] = useState(false);
  const [selectedType, setSelectedType] = useState("salaries");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv"))) {
      setFile(f);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setUploading(false);
    setFile(null);
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* الترويسة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">استيراد Excel</h1>
          <p className="text-blue-300/60 text-sm mt-0.5">رفع ملفات البيانات وإدارة الاستيراد</p>
        </div>
        <a
          href="#"
          className="flex items-center gap-2 text-blue-300/60 hover:text-slate-200 border border-blue-700/30 px-3 py-2 rounded-xl text-sm transition-colors"
        >
          <Download size={15} />
          تنزيل النموذج
        </a>
      </div>

      {/* منطقة الرفع */}
      <div className="bg-slate-800/40 border border-blue-700/30 rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold">رفع ملف جديد</h2>

        {/* نوع الملف */}
        <div className="flex gap-3">
          {Object.entries(typeMap).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                selectedType === key
                  ? "bg-orange-500/15 border-cyan-500/40 text-cyan-400"
                  : "border-blue-700/30 text-blue-300/60 hover:border-slate-600"
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>

        {/* Drag & Drop */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragging
              ? "border-cyan-500/60 bg-orange-500/5"
              : file
              ? "border-green-500/40 bg-green-500/5"
              : "border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/30"
          }`}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
          {file ? (
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-500/15 border border-green-500/20 rounded-xl flex items-center justify-center mx-auto">
                <FileText size={24} className="text-green-400" />
              </div>
              <p className="text-green-400 font-medium">{file.name}</p>
              <p className="text-slate-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-900/50 border border-blue-700/30 rounded-xl flex items-center justify-center mx-auto">
                <Upload size={24} className="text-blue-300/60" />
              </div>
              <div>
                <p className="text-blue-100 font-medium">اسحب الملف هنا أو انقر للاختيار</p>
                <p className="text-slate-500 text-sm mt-1">يدعم: .xlsx, .xls, .csv</p>
              </div>
            </div>
          )}
        </div>

        {/* أزرار الإجراءات */}
        {file && (
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {uploading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                <>
                  <Upload size={15} />
                  رفع الملف
                </>
              )}
            </button>
            <button
              onClick={() => setFile(null)}
              className="px-4 py-2.5 text-blue-300/60 hover:text-red-400 border border-blue-700/30 rounded-xl text-sm transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* تنبيهات */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
        <AlertCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-300 text-sm font-medium">ملاحظات الاستيراد</p>
          <ul className="text-blue-300/60 text-xs mt-1.5 space-y-1">
            <li>• ملفات الرواتب تحتاج اعتمادًا من المدير قبل التطبيق</li>
            <li>• يجب أن يحتوي الملف على الأعمدة المطلوبة حسب النموذج</li>
            <li>• سيتم إرسال إشعار عند اكتمال المعالجة</li>
          </ul>
        </div>
      </div>

      {/* سجل الاستيراد */}
      <div className="space-y-3">
        <h2 className="text-white font-semibold">سجل الاستيراد</h2>
        <div className="bg-slate-800/40 border border-blue-700/30 rounded-2xl overflow-hidden">
          {mockHistory.map((item, i) => {
            const StatusIcon = statusMap[item.status].icon;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-700/20 ${
                  i < mockHistory.length - 1 ? "border-b border-slate-800/50" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-blue-900/50 border border-blue-700/30 rounded-xl flex items-center justify-center">
                    <FileSpreadsheet size={18} className="text-blue-300/60" />
                  </div>
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{item.filename}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${typeMap[item.type].color}`}>
                        {typeMap[item.type].label}
                      </span>
                      <span className="text-slate-500 text-xs">{item.rows} سجل</span>
                      {item.errors && (
                        <span className="text-red-400 text-xs">{item.errors} أخطاء</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left hidden md:block">
                    <p className="text-slate-500 text-xs">{item.uploaded_by}</p>
                    <p className="text-slate-600 text-xs">{item.created_at}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${statusMap[item.status].color}`}>
                    <StatusIcon size={15} />
                    {statusMap[item.status].label}
                  </div>
                  {item.status === "pending" && (
                    <div className="flex gap-1.5">
                      <button className="px-3 py-1.5 bg-green-500/15 text-green-400 text-xs rounded-lg hover:bg-green-500/25 transition-colors">
                        اعتماد
                      </button>
                      <button className="px-3 py-1.5 bg-red-500/15 text-red-400 text-xs rounded-lg hover:bg-red-500/25 transition-colors">
                        رفض
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
