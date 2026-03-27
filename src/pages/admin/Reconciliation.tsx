/**
 * Finance Reconciliation Engine
 * Upload Excel/CSV files from multiple delivery platforms,
 * normalize the data, detect variances against internal records.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  RefreshCw,
  Download,
  Trash2,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Platform = "jahez" | "hungerstation" | "toyou" | "noon" | "talabat" | "other";
type VarianceStatus = "match" | "over" | "under" | "missing";

interface RawRow {
  order_id: string;
  amount: number;
  date: string;
  platform: Platform;
  courier_id?: string;
  raw: Record<string, unknown>;
}

interface InternalRecord {
  order_id: string;
  expected_amount: number;
  date: string;
  platform: Platform;
  courier_id?: string;
}

interface ReconciliationRow {
  order_id: string;
  platform: Platform;
  date: string;
  platform_amount: number | null;
  internal_amount: number | null;
  variance: number;
  status: VarianceStatus;
  courier_id?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  platform: Platform;
  rows: RawRow[];
  uploadedAt: Date;
}

// ─── Fallback internal records (used when Supabase is unavailable) ───────────
const FALLBACK_INTERNAL: InternalRecord[] = [
  { order_id: "ORD-001", expected_amount: 45.00, date: "2026-03-01", platform: "jahez",         courier_id: "COU-01" },
  { order_id: "ORD-002", expected_amount: 32.50, date: "2026-03-01", platform: "hungerstation",  courier_id: "COU-02" },
  { order_id: "ORD-003", expected_amount: 78.00, date: "2026-03-02", platform: "toyou",          courier_id: "COU-01" },
  { order_id: "ORD-004", expected_amount: 55.25, date: "2026-03-02", platform: "jahez",          courier_id: "COU-03" },
  { order_id: "ORD-005", expected_amount: 91.00, date: "2026-03-03", platform: "noon",           courier_id: "COU-02" },
  { order_id: "ORD-006", expected_amount: 18.75, date: "2026-03-03", platform: "talabat",        courier_id: "COU-04" },
  { order_id: "ORD-007", expected_amount: 62.00, date: "2026-03-04", platform: "hungerstation",  courier_id: "COU-03" },
  { order_id: "ORD-008", expected_amount: 44.50, date: "2026-03-04", platform: "jahez",          courier_id: "COU-01" },
];

// ─── Column mapping per platform ─────────────────────────────────────────────
// Maps known platform column names → normalized field names
const COLUMN_MAPS: Record<Platform, Record<string, keyof RawRow>> = {
  jahez:         { "order_id": "order_id", "order number": "order_id", "amount": "amount", "total": "amount", "date": "date", "courier": "courier_id" },
  hungerstation: { "order_id": "order_id", "reference": "order_id",    "payout": "amount", "amount": "amount", "date": "date", "driver_id": "courier_id" },
  toyou:         { "order_id": "order_id", "shipment_id": "order_id",   "cod_amount": "amount", "amount": "amount", "created_at": "date", "date": "date" },
  noon:          { "order_id": "order_id", "tracking_no": "order_id",   "order_value": "amount", "amount": "amount", "order_date": "date", "date": "date" },
  talabat:       { "order_id": "order_id", "talabat_id": "order_id",    "delivery_fee": "amount", "amount": "amount", "date": "date" },
  other:         { "order_id": "order_id", "amount": "amount", "date": "date" },
};

function normalizeRows(rawData: Record<string, unknown>[], platform: Platform): RawRow[] {
  const colMap = COLUMN_MAPS[platform];
  return rawData.map((row) => {
    const normalized: Partial<RawRow> = { platform, raw: row };
    for (const [rawKey, targetKey] of Object.entries(colMap)) {
      const val = row[rawKey] ?? row[rawKey.toUpperCase()] ?? row[rawKey.toLowerCase()];
      if (val !== undefined) {
        if (targetKey === "amount") {
          normalized.amount = parseFloat(String(val).replace(/[^0-9.-]/g, "")) || 0;
        } else {
          (normalized as Record<string, unknown>)[targetKey] = String(val).trim();
        }
      }
    }
    return {
      order_id:   normalized.order_id   || `UNKNOWN-${Math.random().toString(36).slice(2, 7)}`,
      amount:     normalized.amount     ?? 0,
      date:       normalized.date       || "",
      platform,
      courier_id: normalized.courier_id,
      raw: row,
    };
  });
}

function reconcile(uploaded: UploadedFile[], internal: InternalRecord[]): ReconciliationRow[] {
  const internalMap = new Map(internal.map((r) => [r.order_id, r]));
  const platformMap = new Map<string, RawRow>();
  for (const file of uploaded) {
    for (const row of file.rows) {
      platformMap.set(row.order_id, row);
    }
  }

  const results: ReconciliationRow[] = [];
  const seen = new Set<string>();

  // Check all internal records
  for (const int of internal) {
    const ext = platformMap.get(int.order_id);
    seen.add(int.order_id);
    const platform_amount = ext?.amount ?? null;
    const variance = platform_amount !== null ? platform_amount - int.expected_amount : -int.expected_amount;
    let status: VarianceStatus;
    if (platform_amount === null) status = "missing";
    else if (Math.abs(variance) < 0.01) status = "match";
    else if (variance > 0) status = "over";
    else status = "under";

    results.push({
      order_id: int.order_id,
      platform: ext?.platform ?? int.platform,
      date: ext?.date || int.date,
      platform_amount,
      internal_amount: int.expected_amount,
      variance,
      status,
      courier_id: ext?.courier_id || int.courier_id,
    });
  }

  // Check platform rows not in internal records
  for (const [orderId, ext] of platformMap.entries()) {
    if (!seen.has(orderId)) {
      results.push({
        order_id: orderId,
        platform: ext.platform,
        date: ext.date,
        platform_amount: ext.amount,
        internal_amount: null,
        variance: ext.amount,
        status: "over",
        courier_id: ext.courier_id,
      });
    }
  }

  return results.sort((a, b) => {
    const order: VarianceStatus[] = ["missing", "over", "under", "match"];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });
}

// ─── Platform labels ──────────────────────────────────────────────────────────
const PLATFORM_LABELS: Record<Platform, string> = {
  jahez: "جاهز", hungerstation: "هنقرستيشن", toyou: "توصيل", noon: "نون", talabat: "طلبات", other: "أخرى",
};

const STATUS_LABEL: Record<VarianceStatus, string> = {
  match: "مطابق", over: "زيادة", under: "نقص", missing: "مفقود",
};

const STATUS_BADGE_STYLE: Record<VarianceStatus, string> = {
  match: "con-badge-success", over: "con-badge-warning", under: "con-badge-danger", missing: "con-badge-muted",
};

const STATUS_ICON: Record<VarianceStatus, JSX.Element> = {
  match:   <CheckCircle2 size={13} />,
  over:    <TrendingUp size={13} />,
  under:   <TrendingDown size={13} />,
  missing: <XCircle size={13} />,
};

// ─── Valid platform keys for safe mapping ─────────────────────────────────────
const VALID_PLATFORMS = new Set<Platform>(["jahez", "hungerstation", "toyou", "noon", "talabat", "other"]);

// ─── Component ────────────────────────────────────────────────────────────────

export default function Reconciliation() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("jahez");
  const [internalRecords, setInternalRecords] = useState<InternalRecord[]>(FALLBACK_INTERNAL);
  const [results, setResults] = useState<ReconciliationRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<VarianceStatus | "all">("all");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch internal records from Supabase orders table
  useEffect(() => {
    async function fetchInternalRecords() {
      try {
        if (!supabase) throw new Error("no client");
        const { data, error } = await supabase
          .from("orders")
          .select("id, platform, order_date, gross_earnings, net_earnings, courier_id");
        if (error) throw error;
        if (!data || data.length === 0) return;
        const mapped: InternalRecord[] = data.map((row) => ({
          order_id:        String(row.id),
          expected_amount: Number(row.gross_earnings) || 0,
          date:            row.order_date ?? "",
          platform:        VALID_PLATFORMS.has(row.platform as Platform)
                             ? (row.platform as Platform)
                             : "other",
          courier_id:      row.courier_id != null ? String(row.courier_id) : undefined,
        }));
        setInternalRecords(mapped);
      } catch (err) {
        console.warn("Reconciliation: failed to load internal records from Supabase, using fallback.", err);
        setInternalRecords(FALLBACK_INTERNAL);
      }
    }
    fetchInternalRecords();
  }, []);

  // ── KPI derived values
  const kpi = results
    ? {
        total:    results.length,
        matches:  results.filter((r) => r.status === "match").length,
        over:     results.filter((r) => r.status === "over").length,
        under:    results.filter((r) => r.status === "under").length,
        missing:  results.filter((r) => r.status === "missing").length,
        totalVariance: results.reduce((s, r) => s + Math.abs(r.variance), 0),
      }
    : null;

  // ── File parsing
  const parseFile = useCallback(
    (file: File, platform: Platform) => {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const wb = XLSX.read(data, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
          const rows = normalizeRows(rawData, platform);
          const newFile: UploadedFile = {
            id: Math.random().toString(36).slice(2),
            name: file.name,
            platform,
            rows,
            uploadedAt: new Date(),
          };
          setUploadedFiles((prev) => [...prev, newFile]);
          setResults(null); // reset results when new file added
        } catch (err) {
          console.error("Failed to parse file:", err);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsBinaryString(file);
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      parseFile(file, selectedPlatform);
    }
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      for (const file of Array.from(e.dataTransfer.files)) {
        if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
          parseFile(file, selectedPlatform);
        }
      }
    },
    [selectedPlatform, parseFile]
  );

  const handleRunReconciliation = () => {
    setResults(reconcile(uploadedFiles, internalRecords));
  };

  const handleExportCSV = () => {
    if (!results) return;
    const headers = ["order_id", "platform", "date", "platform_amount", "internal_amount", "variance", "status", "courier_id"];
    const rows = results.map((r) =>
      [r.order_id, r.platform, r.date, r.platform_amount ?? "", r.internal_amount ?? "", r.variance.toFixed(2), r.status, r.courier_id ?? ""].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reconciliation_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Filtered results
  const filteredResults = results?.filter((r) => {
    const matchSearch = !search || r.order_id.toLowerCase().includes(search.toLowerCase()) || (r.courier_id || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1400px" }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.25rem" }}>
          محرك المطابقة المالية
        </h1>
        <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)" }}>
          رفع ملفات المنصات، تطبيع البيانات، واكتشاف الفروقات مقارنةً بالسجلات الداخلية
        </p>
      </div>

      {/* ── KPI Cards ── */}
      {kpi && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            { label: "إجمالي الطلبات",  value: kpi.total,         color: "var(--con-brand)",   icon: <FileSpreadsheet size={16} /> },
            { label: "مطابق",            value: kpi.matches,       color: "var(--con-success)",  icon: <CheckCircle2 size={16} /> },
            { label: "زيادة / نقص",     value: kpi.over + kpi.under, color: "var(--con-warning)", icon: <AlertTriangle size={16} /> },
            { label: "مفقود",           value: kpi.missing,       color: "var(--con-danger)",   icon: <XCircle size={16} /> },
            { label: "إجمالي الفروقات (ر.س)", value: kpi.totalVariance.toFixed(2), color: "var(--con-warning)", icon: <Minus size={16} /> },
          ].map((k) => (
            <div key={k.label} className="con-kpi-card" style={{ borderTop: `2px solid ${k.color}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 500 }}>{k.label}</span>
                <span style={{ color: k.color }}>{k.icon}</span>
              </div>
              <div className="con-kpi-value" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1rem", alignItems: "start" }}>

        {/* ── Left panel: Upload ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

          {/* Platform selector */}
          <div className="con-card" style={{ padding: "1rem" }}>
            <p style={{ fontSize: "var(--con-text-caption)", fontWeight: 600, color: "var(--con-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              المنصة المستهدفة
            </p>
            <div style={{ position: "relative" }}>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as Platform)}
                className="con-input"
                style={{ width: "100%", appearance: "none", paddingInlineStart: "2rem" }}
              >
                {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", insetInlineStart: "0.625rem", top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Drop zone */}
          <div
            className="con-card"
            style={{
              padding: "1.5rem",
              border: isDragging ? "1.5px dashed var(--con-brand)" : "1.5px dashed var(--con-border-strong)",
              background: isDragging ? "var(--con-brand-subtle)" : undefined,
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
              textAlign: "center",
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <UploadCloud size={28} style={{ color: "var(--con-brand)", margin: "0 auto 0.625rem" }} />
            <p style={{ fontSize: "var(--con-text-body)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "0.25rem" }}>
              {isProcessing ? "جارٍ المعالجة..." : "اسحب الملف هنا أو انقر"}
            </p>
            <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
              يدعم: .xlsx · .xls · .csv
            </p>
          </div>

          {/* Uploaded files list */}
          {uploadedFiles.length > 0 && (
            <div className="con-card" style={{ padding: "0.75rem" }}>
              <p style={{ fontSize: "var(--con-text-caption)", fontWeight: 600, color: "var(--con-text-muted)", marginBottom: "0.5rem", padding: "0 0.25rem" }}>
                الملفات المرفوعة ({uploadedFiles.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {uploadedFiles.map((f) => (
                  <div key={f.id} style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.5rem 0.625rem",
                    background: "var(--con-bg-elevated)",
                    borderRadius: "var(--con-radius-sm)",
                  }}>
                    <FileSpreadsheet size={14} style={{ color: "var(--con-success)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--con-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.name}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--con-text-muted)" }}>
                        {PLATFORM_LABELS[f.platform]} · {f.rows.length} سطر
                      </p>
                    </div>
                    <button
                      onClick={() => { setUploadedFiles((prev) => prev.filter((x) => x.id !== f.id)); setResults(null); }}
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: "2px", color: "var(--con-text-muted)", borderRadius: "3px" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Run button */}
          <button
            className="con-btn-primary"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            onClick={handleRunReconciliation}
            disabled={uploadedFiles.length === 0}
          >
            <RefreshCw size={15} />
            تشغيل المطابقة
          </button>

          {/* Info notice */}
          <div style={{
            display: "flex", gap: "0.5rem",
            padding: "0.75rem",
            background: "var(--con-info-subtle)",
            border: "1px solid var(--con-brand-border)",
            borderRadius: "var(--con-radius)",
          }}>
            <Info size={14} style={{ color: "var(--con-info)", flexShrink: 0, marginTop: "1px" }} />
            <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)", lineHeight: 1.5 }}>
              يتم مقارنة أرقام الطلبات بالسجلات الداخلية. الفروق أقل من 0.01 ر.س تُعتبر مطابقة.
            </p>
          </div>
        </div>

        {/* ── Right panel: Results ── */}
        <div className="con-card" style={{ padding: 0, overflow: "hidden" }}>

          {/* Toolbar */}
          <div className="con-toolbar" style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--con-border-default)" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", insetInlineEnd: "0.625rem", top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)" }} />
              <input
                className="con-input"
                placeholder="بحث برقم الطلب أو المندوب..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", paddingInlineEnd: "2rem" }}
              />
            </div>

            {/* Status filter pills */}
            <div style={{ display: "flex", gap: "0.375rem" }}>
              {(["all", "match", "over", "under", "missing"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: "0.25rem 0.625rem",
                    borderRadius: "100px",
                    fontSize: "12px", fontWeight: 500,
                    border: "1px solid",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    borderColor: filterStatus === s ? "var(--con-brand)" : "var(--con-border-default)",
                    background: filterStatus === s ? "var(--con-brand-subtle)" : "transparent",
                    color: filterStatus === s ? "var(--con-brand)" : "var(--con-text-muted)",
                  }}
                >
                  {s === "all" ? "الكل" : STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            {results && (
              <button
                className="con-btn-ghost"
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "13px" }}
                onClick={handleExportCSV}
              >
                <Download size={14} />
                تصدير CSV
              </button>
            )}
          </div>

          {/* Table */}
          {!results ? (
            <div className="con-empty" style={{ padding: "4rem 2rem" }}>
              <RefreshCw size={28} style={{ color: "var(--con-text-muted)", margin: "0 auto 0.75rem" }} />
              <p style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-body)" }}>
                ارفع ملفاً وانقر «تشغيل المطابقة» لعرض النتائج
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="con-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>المنصة</th>
                    <th>التاريخ</th>
                    <th style={{ textAlign: "left" }}>مبلغ المنصة</th>
                    <th style={{ textAlign: "left" }}>المبلغ الداخلي</th>
                    <th style={{ textAlign: "left" }}>الفرق</th>
                    <th>الحالة</th>
                    <th>المندوب</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredResults ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", color: "var(--con-text-muted)", padding: "2rem" }}>
                        لا توجد نتائج تطابق الفلتر
                      </td>
                    </tr>
                  ) : (
                    (filteredResults ?? []).map((row) => (
                      <tr key={row.order_id}>
                        <td>
                          <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "12px", color: "var(--con-brand)" }}>
                            {row.order_id}
                          </span>
                        </td>
                        <td>
                          <span className="con-badge-sm con-badge-brand">{PLATFORM_LABELS[row.platform]}</span>
                        </td>
                        <td style={{ color: "var(--con-text-secondary)", fontSize: "12px" }}>
                          {row.date || "—"}
                        </td>
                        <td style={{ textAlign: "left" }}>
                          {row.platform_amount !== null ? (
                            <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "12px", color: "var(--con-text-primary)" }}>
                              {row.platform_amount.toFixed(2)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--con-text-muted)", fontSize: "12px" }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: "left" }}>
                          {row.internal_amount !== null ? (
                            <span style={{ fontFamily: "var(--con-font-mono)", fontSize: "12px", color: "var(--con-text-primary)" }}>
                              {row.internal_amount.toFixed(2)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--con-text-muted)", fontSize: "12px" }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: "left" }}>
                          <span style={{
                            fontFamily: "var(--con-font-mono)", fontSize: "12px", fontWeight: 600,
                            color: row.status === "match" ? "var(--con-success)" : row.status === "over" ? "var(--con-warning)" : "var(--con-danger)",
                          }}>
                            {row.variance >= 0 ? "+" : ""}{row.variance.toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <span className={`con-badge-sm ${STATUS_BADGE_STYLE[row.status]}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                            {STATUS_ICON[row.status]}
                            {STATUS_LABEL[row.status]}
                          </span>
                        </td>
                        <td style={{ color: "var(--con-text-secondary)", fontSize: "12px", fontFamily: "var(--con-font-mono)" }}>
                          {row.courier_id || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Footer */}
              <div style={{
                padding: "0.625rem 1rem",
                borderTop: "1px solid var(--con-border-default)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                  {filteredResults?.length ?? 0} من {results.length} سجل
                </span>
                {kpi && (
                  <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                    نسبة المطابقة:{" "}
                    <span style={{ color: "var(--con-success)", fontWeight: 600, fontFamily: "var(--con-font-mono)" }}>
                      {((kpi.matches / kpi.total) * 100).toFixed(1)}%
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
