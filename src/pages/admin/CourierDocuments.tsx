/**
 * إدارة المستندات — Courier Document Management
 * متابعة مستندات المناديب (هوية، رخصة، تأمين، إقامة، شهادة البنك)
 */
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Download,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  MessageCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PageWrapper, PageHeader, KPIGrid, KPICard, Card, Modal } from "@/components/admin/ui";

// ── Types ────────────────────────────────────────────────────────────────────
type DocStatus = "uploaded" | "missing" | "expired";

interface CourierDocument {
  name: string;
  key: string;
  status: DocStatus;
  expiry_date?: string;
  upload_date?: string;
  url?: string;
}

interface CourierRecord {
  id: string;
  name: string;
  phone: string;
  identity: DocStatus;
  license: DocStatus;
  insurance: DocStatus;
  iqama: DocStatus;
  bank_cert: DocStatus;
  documents: CourierDocument[];
}

type FilterType = "all" | "missing" | "expired";

// ── Status helpers ───────────────────────────────────────────────────────────
const STATUS_COLORS: Record<DocStatus, string> = {
  uploaded: "var(--con-success)",
  missing: "var(--con-danger)",
  expired: "var(--con-warning)",
};

const STATUS_LABELS: Record<DocStatus, string> = {
  uploaded: "مرفوع",
  missing: "ناقص",
  expired: "منتهي",
};

const DOC_NAMES: Record<string, string> = {
  identity: "الهوية",
  license: "الرخصة",
  insurance: "التأمين",
  iqama: "الإقامة",
  bank_cert: "شهادة البنك",
};

// ── CSV helper ───────────────────────────────────────────────────────────────
function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map((r) =>
      keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ── Mock data ────────────────────────────────────────────────────────────────
function buildDocs(statuses: Record<string, { status: DocStatus; expiry?: string; upload?: string }>): CourierDocument[] {
  return Object.entries(statuses).map(([key, val]) => ({
    name: DOC_NAMES[key] || key,
    key,
    status: val.status,
    expiry_date: val.expiry,
    upload_date: val.upload,
    url: val.status === "uploaded" ? `https://storage.fll.sa/docs/${key}_sample.pdf` : undefined,
  }));
}

const MOCK_DATA: CourierRecord[] = [
  {
    id: "C001", name: "أحمد محمد العتيبي", phone: "0501234567",
    identity: "uploaded", license: "uploaded", insurance: "uploaded", iqama: "uploaded", bank_cert: "uploaded",
    documents: buildDocs({
      identity: { status: "uploaded", expiry: "2027-06-15", upload: "2025-11-01" },
      license: { status: "uploaded", expiry: "2026-12-20", upload: "2025-10-15" },
      insurance: { status: "uploaded", expiry: "2026-09-01", upload: "2025-09-01" },
      iqama: { status: "uploaded", expiry: "2027-03-10", upload: "2025-08-20" },
      bank_cert: { status: "uploaded", expiry: undefined, upload: "2025-11-05" },
    }),
  },
  {
    id: "C002", name: "خالد عبدالله الشمري", phone: "0559876543",
    identity: "uploaded", license: "missing", insurance: "uploaded", iqama: "uploaded", bank_cert: "missing",
    documents: buildDocs({
      identity: { status: "uploaded", expiry: "2027-01-20", upload: "2025-07-10" },
      license: { status: "missing" },
      insurance: { status: "uploaded", expiry: "2026-08-15", upload: "2025-08-15" },
      iqama: { status: "uploaded", expiry: "2027-05-01", upload: "2025-06-01" },
      bank_cert: { status: "missing" },
    }),
  },
  {
    id: "C003", name: "محمد سعد القحطاني", phone: "0541112233",
    identity: "uploaded", license: "uploaded", insurance: "expired", iqama: "uploaded", bank_cert: "uploaded",
    documents: buildDocs({
      identity: { status: "uploaded", expiry: "2027-08-01", upload: "2025-12-01" },
      license: { status: "uploaded", expiry: "2026-11-15", upload: "2025-11-01" },
      insurance: { status: "expired", expiry: "2026-03-01", upload: "2025-03-01" },
      iqama: { status: "uploaded", expiry: "2027-02-28", upload: "2025-09-15" },
      bank_cert: { status: "uploaded", expiry: undefined, upload: "2025-10-20" },
    }),
  },
  {
    id: "C004", name: "عبدالرحمن فهد الدوسري", phone: "0562223344",
    identity: "missing", license: "missing", insurance: "missing", iqama: "expired", bank_cert: "missing",
    documents: buildDocs({
      identity: { status: "missing" },
      license: { status: "missing" },
      insurance: { status: "missing" },
      iqama: { status: "expired", expiry: "2026-02-15", upload: "2024-02-15" },
      bank_cert: { status: "missing" },
    }),
  },
  {
    id: "C005", name: "سلطان ناصر الحربي", phone: "0573334455",
    identity: "uploaded", license: "uploaded", insurance: "uploaded", iqama: "expired", bank_cert: "uploaded",
    documents: buildDocs({
      identity: { status: "uploaded", expiry: "2027-04-10", upload: "2025-04-10" },
      license: { status: "uploaded", expiry: "2026-10-30", upload: "2025-10-01" },
      insurance: { status: "uploaded", expiry: "2026-07-20", upload: "2025-07-20" },
      iqama: { status: "expired", expiry: "2026-01-05", upload: "2024-01-05" },
      bank_cert: { status: "uploaded", expiry: undefined, upload: "2025-11-10" },
    }),
  },
  {
    id: "C006", name: "فيصل يوسف المالكي", phone: "0584445566",
    identity: "uploaded", license: "uploaded", insurance: "uploaded", iqama: "uploaded", bank_cert: "uploaded",
    documents: buildDocs({
      identity: { status: "uploaded", expiry: "2028-01-01", upload: "2026-01-01" },
      license: { status: "uploaded", expiry: "2027-06-15", upload: "2026-01-15" },
      insurance: { status: "uploaded", expiry: "2027-01-01", upload: "2026-01-01" },
      iqama: { status: "uploaded", expiry: "2028-06-01", upload: "2026-02-01" },
      bank_cert: { status: "uploaded", expiry: undefined, upload: "2026-02-10" },
    }),
  },
  {
    id: "C007", name: "تركي حمد الزهراني", phone: "0595556677",
    identity: "uploaded", license: "expired", insurance: "missing", iqama: "uploaded", bank_cert: "uploaded",
    documents: buildDocs({
      identity: { status: "uploaded", expiry: "2027-09-20", upload: "2025-09-20" },
      license: { status: "expired", expiry: "2026-03-15", upload: "2025-03-15" },
      insurance: { status: "missing" },
      iqama: { status: "uploaded", expiry: "2027-07-01", upload: "2025-07-01" },
      bank_cert: { status: "uploaded", expiry: undefined, upload: "2025-12-01" },
    }),
  },
  {
    id: "C008", name: "ماجد عادل السبيعي", phone: "0506667788",
    identity: "uploaded", license: "uploaded", insurance: "uploaded", iqama: "uploaded", bank_cert: "missing",
    documents: buildDocs({
      identity: { status: "uploaded", expiry: "2027-11-10", upload: "2025-11-10" },
      license: { status: "uploaded", expiry: "2026-08-01", upload: "2025-08-01" },
      insurance: { status: "uploaded", expiry: "2026-06-15", upload: "2025-06-15" },
      iqama: { status: "uploaded", expiry: "2027-12-01", upload: "2025-12-01" },
      bank_cert: { status: "missing" },
    }),
  },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function CourierDocuments() {
  const [data, setData] = useState<CourierRecord[]>(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedCourier, setSelectedCourier] = useState<CourierRecord | null>(null);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from("courier_documents")
        .select("*")
        .order("name");
      if (error) throw error;
      if (rows?.length) setData(rows as unknown as CourierRecord[]);
    } catch {
      // keep mock data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filters ──────────────────────────────────────────────────────────────
  const hasMissing = (c: CourierRecord) =>
    [c.identity, c.license, c.insurance, c.iqama, c.bank_cert].includes("missing");
  const hasExpired = (c: CourierRecord) =>
    [c.identity, c.license, c.insurance, c.iqama, c.bank_cert].includes("expired");
  const isComplete = (c: CourierRecord) => !hasMissing(c) && !hasExpired(c);

  const filtered = data.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "missing" && hasMissing(c)) ||
      (filter === "expired" && hasExpired(c));
    return matchSearch && matchFilter;
  });

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalCouriers = data.length;
  const completeDocs = data.filter(isComplete).length;
  const missingDocs = data.filter(hasMissing).length;
  const expiredDocs = data.filter(hasExpired).length;

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "missing", label: "مستندات ناقصة" },
    { key: "expired", label: "منتهية الصلاحية" },
  ];

  function handleUpload(docKey: string) {
    if (!uploadUrl.trim()) {
      toast.error("أدخل رابط المستند");
      return;
    }
    // Update local state (placeholder for real API)
    setSelectedCourier((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [docKey]: "uploaded" as DocStatus,
        documents: prev.documents.map((d) =>
          d.key === docKey
            ? { ...d, status: "uploaded" as DocStatus, url: uploadUrl, upload_date: new Date().toISOString().split("T")[0] }
            : d,
        ),
      };
    });
    toast.success("تم رفع المستند بنجاح");
    setUploadUrl("");
    setUploadingDoc(null);
  }

  function renderStatusBadge(status: DocStatus) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          background: `color-mix(in srgb, ${STATUS_COLORS[status]} 15%, transparent)`,
          color: STATUS_COLORS[status],
        }}
      >
        {status === "uploaded" && <CheckCircle2 size={11} />}
        {status === "missing" && <XCircle size={11} />}
        {status === "expired" && <AlertTriangle size={11} />}
        {STATUS_LABELS[status]}
      </span>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        icon={FileText}
        title="إدارة المستندات"
        subtitle="متابعة وإدارة مستندات المناديب"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="con-btn con-btn-ghost"
              style={{ gap: 6, fontSize: 12 }}
              onClick={() => {
                const csvRows = filtered.map((c) => ({
                  الرقم: c.id,
                  الاسم: c.name,
                  الجوال: c.phone,
                  الهوية: STATUS_LABELS[c.identity],
                  الرخصة: STATUS_LABELS[c.license],
                  التأمين: STATUS_LABELS[c.insurance],
                  الإقامة: STATUS_LABELS[c.iqama],
                  "شهادة البنك": STATUS_LABELS[c.bank_cert],
                }));
                downloadCSV(csvRows as unknown as Record<string, unknown>[], "courier_documents.csv");
              }}
            >
              <Download size={14} /> تصدير CSV
            </button>
            <button
              className="con-btn con-btn-ghost"
              style={{ gap: 6, fontSize: 12 }}
              onClick={() => {
                setLoading(true);
                fetchData().finally(() => setLoading(false));
              }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> تحديث
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <KPIGrid>
        <KPICard icon={Users} label="إجمالي المناديب" value={totalCouriers} accent="var(--con-brand)" />
        <KPICard icon={CheckCircle2} label="مكتملة المستندات" value={completeDocs} accent="var(--con-success)" />
        <KPICard icon={XCircle} label="ناقصة" value={missingDocs} accent="var(--con-danger)" />
        <KPICard icon={AlertTriangle} label="منتهية الصلاحية" value={expiredDocs} accent="var(--con-warning)" />
      </KPIGrid>

      {/* Search + Filter */}
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--con-text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="بحث بالاسم أو الرقم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="con-input"
              style={{ paddingRight: 32, width: "100%", fontSize: 13 }}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`con-btn ${filter === f.key ? "con-btn-primary" : "con-btn-ghost"}`}
                style={{ fontSize: 12, padding: "6px 14px" }}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        <div style={{ overflowX: "auto" }}>
          <table className="con-table" style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: "10px 14px", textAlign: "start" }}>#</th>
                <th style={{ padding: "10px 14px", textAlign: "start" }}>المندوب</th>
                <th style={{ padding: "10px 14px", textAlign: "center" }}>الهوية</th>
                <th style={{ padding: "10px 14px", textAlign: "center" }}>الرخصة</th>
                <th style={{ padding: "10px 14px", textAlign: "center" }}>التأمين</th>
                <th style={{ padding: "10px 14px", textAlign: "center" }}>الإقامة</th>
                <th style={{ padding: "10px 14px", textAlign: "center" }}>شهادة البنك</th>
                <th style={{ padding: "10px 14px", textAlign: "center" }}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--con-text-muted)" }}>
                    لا توجد نتائج
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedCourier(c)}
                  >
                    <td style={{ padding: "10px 14px", color: "var(--con-text-muted)", fontSize: 12 }}>{i + 1}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{c.phone}</div>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>{renderStatusBadge(c.identity)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>{renderStatusBadge(c.license)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>{renderStatusBadge(c.insurance)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>{renderStatusBadge(c.iqama)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>{renderStatusBadge(c.bank_cert)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <button
                        className="con-btn con-btn-ghost"
                        style={{ fontSize: 11, gap: 4, padding: "4px 10px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourier(c);
                        }}
                      >
                        <Eye size={12} /> تفاصيل
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        open={!!selectedCourier}
        onClose={() => {
          setSelectedCourier(null);
          setUploadingDoc(null);
          setUploadUrl("");
        }}
        title={selectedCourier ? `مستندات ${selectedCourier.name}` : ""}
        width={640}
      >
        {selectedCourier && (
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {selectedCourier.documents.map((doc) => (
              <div
                key={doc.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "var(--con-bg-surface-2)",
                  borderRadius: "var(--con-radius)",
                  border: "1px solid var(--con-border-default)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "var(--con-text-primary)" }}>
                      {doc.name}
                    </span>
                    {renderStatusBadge(doc.status)}
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--con-text-muted)" }}>
                    {doc.expiry_date && <span>انتهاء: {doc.expiry_date}</span>}
                    {doc.upload_date && <span>رفع: {doc.upload_date}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {uploadingDoc === doc.key ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="رابط المستند..."
                        value={uploadUrl}
                        onChange={(e) => setUploadUrl(e.target.value)}
                        className="con-input"
                        style={{ fontSize: 11, padding: "4px 8px", width: 180 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        className="con-btn con-btn-primary"
                        style={{ fontSize: 11, padding: "4px 10px" }}
                        onClick={() => handleUpload(doc.key)}
                      >
                        حفظ
                      </button>
                      <button
                        className="con-btn con-btn-ghost"
                        style={{ fontSize: 11, padding: "4px 10px" }}
                        onClick={() => {
                          setUploadingDoc(null);
                          setUploadUrl("");
                        }}
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className="con-btn con-btn-ghost"
                        style={{ fontSize: 11, gap: 4, padding: "4px 10px" }}
                        onClick={() => setUploadingDoc(doc.key)}
                      >
                        <Upload size={11} /> رفع مستند
                      </button>
                      <button
                        className="con-btn con-btn-ghost"
                        style={{ fontSize: 11, gap: 4, padding: "4px 10px" }}
                        onClick={() => {
                          window.open(
                            `https://wa.me/966${selectedCourier.phone.replace(/^0/, "")}?text=${encodeURIComponent(`مرحباً ${selectedCourier.name}، يرجى رفع مستند "${doc.name}" في أقرب وقت.`)}`,
                            "_blank",
                          );
                        }}
                      >
                        <MessageCircle size={11} /> تنبيه المندوب
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
