import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Package,
  CheckCircle2,
  XCircle,
  Bike,
  MapPin,
  RefreshCw,
  Clock,
  TrendingUp,
  Download,
  Printer,
  User,
  Phone,
  Hash,
  CalendarDays,
  DollarSign,
  Truck,
} from "lucide-react";
import {
  PageWrapper,
  PageHeader,
  KPIGrid,
  KPICard,
  Toolbar,
  Card,
  Table,
  Badge,
  Button,
  Select,
  SkeletonRows,
  Modal,
  DetailField,
  DetailGrid,
  Section,
  IconButton,
} from "@/components/admin/ui";

interface Order {
  id: string;
  courier_name: string;
  platform: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  status:
    | "pending"
    | "picked_up"
    | "on_way"
    | "delivered"
    | "failed"
    | "returned";
  amount: number;
  created_at: string;
  created_date: string;
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "warning" | "info" | "brand" | "success" | "danger" | "muted";
  }
> = {
  pending: { label: "بانتظار الاستلام", variant: "warning" },
  picked_up: { label: "تم الاستلام", variant: "info" },
  on_way: { label: "في الطريق", variant: "brand" },
  delivered: { label: "تم التسليم", variant: "success" },
  failed: { label: "فشل التسليم", variant: "danger" },
  returned: { label: "مرتجع", variant: "muted" },
};

const platforms = [
  "الكل",
  "jahez",
  "hungerstation",
  "toyor",
  "marsool",
  "mrsool",
  "noon",
  "amazon",
];
const platformLabels: Record<string, string> = {
  الكل: "الكل",
  jahez: "جاهز",
  hungerstation: "هنقرستيشن",
  toyor: "طيور",
  marsool: "مرسول",
  mrsool: "مرسول برو",
  noon: "نون",
  amazon: "أمازون",
};

const _TODAY = new Date().toISOString().slice(0, 10);
const _YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

const mockOrders: Order[] = [
  {
    id: "#10240",
    courier_name: "أحمد محمد",
    platform: "jahez",
    customer_name: "محمد علي",
    customer_phone: "0501234567",
    address: "الرياض، حي النزهة",
    status: "on_way",
    amount: 45,
    created_at: "14:23",
    created_date: _TODAY,
  },
  {
    id: "#10239",
    courier_name: "خالد العمري",
    platform: "marsool",
    customer_name: "فاطمة السالم",
    customer_phone: "0557654321",
    address: "جدة، حي الروضة",
    status: "delivered",
    amount: 30,
    created_at: "13:55",
    created_date: _TODAY,
  },
  {
    id: "#10238",
    courier_name: "فهد الغامدي",
    platform: "noon",
    customer_name: "علي أحمد",
    customer_phone: "0509876543",
    address: "الرياض، حي الملقا",
    status: "picked_up",
    amount: 65,
    created_at: "13:40",
    created_date: _TODAY,
  },
  {
    id: "#10237",
    courier_name: "سعد الزهراني",
    platform: "marsool",
    customer_name: "هند محمد",
    customer_phone: "0551112233",
    address: "الدمام، حي الفيصلية",
    status: "pending",
    amount: 25,
    created_at: "13:10",
    created_date: _YESTERDAY,
  },
  {
    id: "#10236",
    courier_name: "عمر الشمري",
    platform: "amazon",
    customer_name: "عبدالله خالد",
    customer_phone: "0503334455",
    address: "الرياض، حي العليا",
    status: "delivered",
    amount: 80,
    created_at: "12:45",
    created_date: _YESTERDAY,
  },
  {
    id: "#10235",
    courier_name: "محمد القحطاني",
    platform: "jahez",
    customer_name: "نورة العتيبي",
    customer_phone: "0556667788",
    address: "مكة، حي العزيزية",
    status: "failed",
    amount: 55,
    created_at: "12:20",
    created_date: _YESTERDAY,
  },
  {
    id: "#10234",
    courier_name: "أحمد محمد",
    platform: "marsool",
    customer_name: "سلمى الشريف",
    customer_phone: "0509998877",
    address: "الرياض، حي السلام",
    status: "returned",
    amount: 40,
    created_at: "11:55",
    created_date: _YESTERDAY,
  },
];

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("الكل");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  async function fetchOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, couriers(full_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        const mapped = data.map((o: any) => ({
          id: `#${o.id}`,
          courier_name: o.couriers?.full_name || "غير محدد",
          platform: o.platform,
          customer_name: o.customer_name || "غير محدد",
          customer_phone: o.customer_phone || "",
          address: o.delivery_address || "",
          status: o.status,
          amount: o.amount || 0,
          created_at: new Date(o.created_at).toLocaleTimeString("ar-SA", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          created_date: o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : _TODAY,
        }));
        setOrders(mapped);
      }
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.id.includes(search) ||
      o.courier_name.includes(search) ||
      o.customer_name.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchPlatform =
      platformFilter === "الكل" || o.platform === platformFilter;
    if (dateFrom && o.created_date < dateFrom) return false;
    if (dateTo && o.created_date > dateTo) return false;
    return matchSearch && matchStatus && matchPlatform;
  });

  const stats = {
    total: orders.length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    active: orders.filter((o) =>
      ["pending", "picked_up", "on_way"].includes(o.status),
    ).length,
    failed: orders.filter(
      (o) => o.status === "failed" || o.status === "returned",
    ).length,
  };

  const totalAmount = filtered.reduce((s, o) => s + o.amount, 0);

  function downloadCSV() {
    const headers = ["orderId", "customerName", "courierName", "platform", "amount", "status", "createdAt"];
    const rows = filtered.map((o) => [
      o.id,
      o.customer_name,
      o.courier_name,
      platformLabels[o.platform] ?? o.platform,
      o.amount.toString(),
      statusConfig[o.status]?.label ?? o.status,
      o.created_at,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageWrapper>
      <PageHeader
        icon={Package}
        title="الطلبات"
        subtitle="تتبع ومتابعة جميع طلبات التوصيل"
        actions={
          <>
            <IconButton icon={Download} onClick={downloadCSV} title="تصدير CSV" />
            <IconButton icon={Printer} onClick={() => window.print()} title="طباعة" />
            <Button
              variant="ghost"
              icon={RefreshCw}
              onClick={() => fetchOrders()}
            >
              تحديث
            </Button>
          </>
        }
      />

      <KPIGrid>
        <KPICard
          label="إجمالي اليوم"
          value={stats.total}
          icon={Package}
          accent="var(--con-brand)"
          loading={loading}
        />
        <KPICard
          label="تم التسليم"
          value={stats.delivered}
          icon={CheckCircle2}
          accent="var(--con-success)"
          loading={loading}
        />
        <KPICard
          label="جارية"
          value={stats.active}
          icon={Bike}
          accent="var(--con-info)"
          loading={loading}
        />
        <KPICard
          label="فشل / مرتجع"
          value={stats.failed}
          icon={XCircle}
          accent="var(--con-danger)"
          loading={loading}
        />
      </KPIGrid>

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="ابحث برقم الطلب، المندوب، أو العميل..."
      >
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "كل الحالات" },
            { value: "pending", label: "بانتظار الاستلام" },
            { value: "on_way", label: "في الطريق" },
            { value: "delivered", label: "تم التسليم" },
            { value: "failed", label: "فشل" },
            { value: "returned", label: "مرتجع" },
          ]}
          style={{ minWidth: 170 }}
        />
        <Select
          value={platformFilter}
          onChange={setPlatformFilter}
          options={platforms.map((p) => ({
            value: p,
            label: platformLabels[p] ?? p,
          }))}
          style={{ minWidth: 150 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "var(--con-text-muted)", whiteSpace: "nowrap" }}>من</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              background: "var(--con-bg, #07111d)",
              border: "1px solid var(--con-border, #1a3a52)",
              borderRadius: 8,
              padding: "6px 12px",
              color: "var(--con-text, #e2e8f0)",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          />
          <label style={{ fontSize: 12, color: "var(--con-text-muted)", whiteSpace: "nowrap" }}>إلى</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              background: "var(--con-bg, #07111d)",
              border: "1px solid var(--con-border, #1a3a52)",
              borderRadius: 8,
              padding: "6px 12px",
              color: "var(--con-text, #e2e8f0)",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          />
        </div>
      </Toolbar>

      <Card noPadding>
        <Table
          headers={[
            "رقم الطلب",
            "المندوب",
            "المنصة",
            "العميل",
            "العنوان",
            "المبلغ",
            "الحالة",
            "الوقت",
          ]}
          isEmpty={!loading && filtered.length === 0}
          emptyIcon={Package}
          emptyText="لا توجد طلبات تطابق المعايير المحددة"
        >
          {loading ? (
            <SkeletonRows rows={5} cols={8} />
          ) : (
            filtered.map((order) => {
              const sc = statusConfig[order.status];
              return (
                <tr key={order.id} onClick={() => setSelectedOrder(order)} style={{ cursor: "pointer" }}>
                  <td
                    className="con-td-mono"
                    style={{ color: "var(--con-brand)" }}
                  >
                    {order.id}
                  </td>
                  <td className="con-td-primary">{order.courier_name}</td>
                  <td>
                    <Badge variant="muted">
                      {platformLabels[order.platform] ?? order.platform}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ lineHeight: 1.4 }}>
                      <div
                        style={{
                          color: "var(--con-text-primary)",
                          fontWeight: 500,
                        }}
                      >
                        {order.customer_name}
                      </div>
                      <div
                        className="con-mono"
                        style={{
                          fontSize: "var(--con-text-caption)",
                          color: "var(--con-text-muted)",
                        }}
                      >
                        {order.customer_phone}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.25rem",
                        maxWidth: "9rem",
                      }}
                    >
                      <MapPin
                        size={11}
                        style={{
                          color: "var(--con-text-muted)",
                          marginTop: "0.15rem",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          color: "var(--con-text-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {order.address}
                      </span>
                    </div>
                  </td>
                  <td className="con-td-mono">{order.amount.toFixed(0)} ر.س</td>
                  <td>
                    <Badge variant={sc?.variant ?? "muted"}>
                      {sc?.label ?? order.status}
                    </Badge>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <Clock
                        size={11}
                        style={{ color: "var(--con-text-muted)" }}
                      />
                      <span
                        className="con-mono"
                        style={{
                          color: "var(--con-text-muted)",
                          fontSize: "var(--con-text-caption)",
                        }}
                      >
                        {order.created_at}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </Table>
        {!loading && filtered.length > 0 && (
          <div
            style={{
              padding: "0.75rem 1.25rem",
              borderTop: "1px solid var(--con-border-default)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "var(--con-text-caption)",
              color: "var(--con-text-muted)",
            }}
          >
            <span>{filtered.length} طلب معروض</span>
            <span
              style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
            >
              <TrendingUp size={12} style={{ color: "var(--con-success)" }} />
              الإجمالي:{" "}
              <span
                className="con-mono"
                style={{ color: "var(--con-text-primary)" }}
              >
                {totalAmount.toFixed(0)} ر.س
              </span>
            </span>
          </div>
        )}
      </Card>

      {/* Order Detail Modal */}
      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`تفاصيل الطلب ${selectedOrder?.id ?? ""}`}
        width={600}
        actions={
          <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
            إغلاق
          </Button>
        }
      >
        {selectedOrder && (() => {
          const sc = statusConfig[selectedOrder.status];
          return (
            <>
              <Section title="معلومات الطلب" style={{ marginTop: 0 }}>
                <DetailGrid cols={2}>
                  <DetailField label="رقم الطلب" value={selectedOrder.id} icon={Hash} mono />
                  <DetailField
                    label="الحالة"
                    value={<Badge variant={sc?.variant ?? "muted"}>{sc?.label ?? selectedOrder.status}</Badge>}
                  />
                  <DetailField label="المنصة" value={platformLabels[selectedOrder.platform] ?? selectedOrder.platform} icon={Truck} />
                  <DetailField label="المبلغ" value={`${selectedOrder.amount.toFixed(0)} ر.س`} icon={DollarSign} mono />
                </DetailGrid>
              </Section>

              <Section title="معلومات العميل">
                <DetailGrid cols={2}>
                  <DetailField label="اسم العميل" value={selectedOrder.customer_name} icon={User} />
                  <DetailField label="رقم الجوال" value={selectedOrder.customer_phone} icon={Phone} mono />
                  <DetailField label="العنوان" value={selectedOrder.address} icon={MapPin} />
                </DetailGrid>
              </Section>

              <Section title="معلومات المندوب والتوقيت">
                <DetailGrid cols={2}>
                  <DetailField label="المندوب" value={selectedOrder.courier_name} icon={Bike} />
                  <DetailField label="الوقت" value={selectedOrder.created_at} icon={CalendarDays} mono />
                </DetailGrid>
              </Section>
            </>
          );
        })()}
      </Modal>
    </PageWrapper>
  );
}
