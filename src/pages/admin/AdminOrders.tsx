/**
 * صفحة إدارة الطلبات - Admin Orders Management
 * FirstLine Logistics
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";
import { motion } from "framer-motion";
import {
  Package,
  Search,
  Filter,
  MoreHorizontal,
  MapPin,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Download,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Plus,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Combobox } from "@/components/ui/combobox";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { BulkActions, useBulkSelect } from "@/components/admin/BulkActions";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Inbox } from "lucide-react";

const ordersData = [
  {
    id: "FLL-10847",
    platform: "هنقرستيشن",
    customer: "عميل #4821",
    driver: "أحمد محمد",
    city: "جدة",
    status: "delivered",
    amount: 45,
    date: "2026-02-20",
    time: "14:35",
  },
  {
    id: "FLL-10846",
    platform: "جاهز",
    customer: "عميل #3290",
    driver: "خالد علي",
    city: "الرياض",
    status: "in_transit",
    amount: 62,
    date: "2026-02-20",
    time: "14:28",
  },
  {
    id: "FLL-10845",
    platform: "مرسول",
    customer: "عميل #7156",
    driver: "سعد ناصر",
    city: "جدة",
    status: "picked_up",
    amount: 38,
    date: "2026-02-20",
    time: "14:15",
  },
  {
    id: "FLL-10844",
    platform: "نون فود",
    customer: "عميل #9432",
    driver: "—",
    city: "الدمام",
    status: "pending",
    amount: 55,
    date: "2026-02-20",
    time: "14:08",
  },
  {
    id: "FLL-10843",
    platform: "هنقرستيشن",
    customer: "عميل #2187",
    driver: "عمر سعيد",
    city: "مكة",
    status: "delivered",
    amount: 29,
    date: "2026-02-20",
    time: "13:55",
  },
  {
    id: "FLL-10842",
    platform: "جاهز",
    customer: "عميل #6743",
    driver: "فهد أحمد",
    city: "الرياض",
    status: "cancelled",
    amount: 42,
    date: "2026-02-20",
    time: "13:40",
  },
  {
    id: "FLL-10841",
    platform: "مرسول",
    customer: "عميل #8901",
    driver: "محمد يوسف",
    city: "جدة",
    status: "delivered",
    amount: 71,
    date: "2026-02-20",
    time: "13:22",
  },
  {
    id: "FLL-10840",
    platform: "هنقرستيشن",
    customer: "عميل #1567",
    driver: "عبدالله سالم",
    city: "المدينة",
    status: "in_transit",
    amount: 36,
    date: "2026-02-20",
    time: "13:10",
  },
];

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof CheckCircle2;
  }
> = {
  delivered: { label: "تم التسليم", variant: "default", icon: CheckCircle2 },
  in_transit: { label: "في الطريق", variant: "secondary", icon: Truck },
  picked_up: { label: "تم الاستلام", variant: "outline", icon: Package },
  pending: { label: "قيد الانتظار", variant: "outline", icon: Clock },
  cancelled: { label: "ملغي", variant: "destructive", icon: XCircle },
};

// summaryStats moved inside component to be computed from orders state

const emptyOrderForm = {
  customer: "",
  platform: "جاهز",
  driver: "",
  city: "الرياض",
  notes: "",
};

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const { selected, toggle, selectAll, clear, isSelected } = useBulkSelect();
  const [selectedOrder, setSelectedOrder] = useState<
    (typeof ordersData)[0] | null
  >(null);
  const [cityFilter, setCityFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [orders, setOrders] = useState(ordersData);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<(typeof ordersData)[0] | null>(
    null,
  );
  const [form, setForm] = useState(emptyOrderForm);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        setOrders(data.map((row: any) => ({
          id: row.order_id || row.id || `FLL-${row.id}`,
          platform: row.platform_name || row.platform || "FLL",
          customer: row.customer_name || row.customer || `عميل #${row.id}`,
          driver: row.driver_name || row.driver || "—",
          city: row.city || "غير محدد",
          status: row.status || "pending",
          amount: Number(row.amount || row.total_amount || 0),
          date: row.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          time: row.created_at?.slice(11, 16) || "00:00",
        })));
      }
    } catch (e) {
      console.warn("Orders fetch failed, using mock data");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useAutoRefresh(fetchOrders, { interval: 30_000 });

  const summaryStats = [
    { label: "طلبات اليوم", value: String(orders.length), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "تم التسليم", value: String(orders.filter(o => o.status === "delivered").length), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "في الطريق", value: String(orders.filter(o => o.status === "in_transit").length), icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "ملغي", value: String(orders.filter(o => o.status === "cancelled").length), icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  function openAdd() {
    setForm(emptyOrderForm);
    setEditingItem(null);
    setShowAddModal(true);
  }
  function openEdit(order: (typeof ordersData)[0]) {
    setForm({
      customer: order.customer,
      platform: order.platform,
      driver: order.driver,
      city: order.city,
      notes: "",
    });
    setEditingItem(order);
    setShowAddModal(true);
  }
  function handleSave() {
    if (!form.customer.trim()) return;
    if (editingItem) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === editingItem.id
            ? {
                ...o,
                customer: form.customer,
                platform: form.platform,
                driver: form.driver || "—",
                city: form.city,
              }
            : o,
        ),
      );
    } else {
      const newOrder = {
        id: `FLL-${10848 + orders.length}`,
        platform: form.platform,
        customer: form.customer,
        driver: form.driver || "—",
        city: form.city,
        status: "pending" as const,
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
      };
      setOrders((prev) => [newOrder, ...prev]);
      if (supabase) {
        supabase.from("orders").insert({
          platform_name: form.platform,
          customer_name: form.customer,
          driver_name: form.driver || null,
          city: form.city,
          status: "pending",
          amount: 0,
          notes: form.notes || null,
        }).then(({ error }) => {
          if (error) console.warn("Failed to save order to Supabase:", error);
        });
      }
    }
    setShowAddModal(false);
  }

  const cityOptions = [...new Set(orders.map((o) => o.city))].map((c) => ({
    value: c,
    label: c,
  }));

  const allFiltered = orders.filter((o) => {
    const matchSearch =
      o.id.includes(search) ||
      o.platform.includes(search) ||
      o.driver.includes(search) ||
      o.city.includes(search);
    const matchTab = tab === "all" || o.status === tab;
    const matchCity = !cityFilter || o.city === cityFilter;
    const matchDate = !dateRange.from || !dateRange.to ||
      (o.date >= dateRange.from && o.date <= dateRange.to);
    return matchSearch && matchTab && matchCity && matchDate;
  });
  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
  const filteredOrders = allFiltered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* العنوان */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
          <p className="text-muted-foreground text-sm mt-1">
            تتبع وإدارة جميع طلبات التوصيل
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 ml-2" />
                تصدير
                <ChevronDown className="w-3 h-3 mr-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => {
                exportToExcel(orders.map(o => ({ "رقم الطلب": o.id, المنصة: o.platform, العميل: o.customer, السائق: o.driver, المدينة: o.city, المبلغ: o.amount, الحالة: statusConfig[o.status]?.label || o.status, التاريخ: o.date, الوقت: o.time })), "orders-report", "الطلبات");
              }}>
                <FileSpreadsheet className="w-3.5 h-3.5 ml-2" />
                تصدير Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const headers = ["رقم الطلب", "المنصة", "العميل", "السائق", "المدينة", "المبلغ", "الحالة", "التاريخ", "الوقت"];
                const rows = orders.map(o => [o.id, o.platform, o.customer, o.driver, o.city, String(o.amount), statusConfig[o.status]?.label || o.status, o.date, o.time]);
                exportToPDF("تقرير الطلبات", headers, rows, "orders-report");
              }}>
                <FileText className="w-3.5 h-3.5 ml-2" />
                تصدير PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const headers = ["رقم الطلب", "المنصة", "العميل", "السائق", "المدينة", "المبلغ", "الحالة", "التاريخ", "الوقت"];
                const rows = orders.map(o => [o.id, o.platform, o.customer, o.driver, o.city, String(o.amount), statusConfig[o.status]?.label || o.status, o.date, o.time]);
                const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "orders-report.csv";
                link.click();
              }}>
                <Download className="w-3.5 h-3.5 ml-2" />
                تصدير CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => fetchOrders()}>
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة طلب
          </Button>
        </div>
      </div>

      {/* ملخص */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold font-mono">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* الجدول */}
      <Card>
        <CardHeader className="pb-4 space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all">الكل</TabsTrigger>
              <TabsTrigger value="pending">قيد الانتظار</TabsTrigger>
              <TabsTrigger value="in_transit">في الطريق</TabsTrigger>
              <TabsTrigger value="delivered">تم التسليم</TabsTrigger>
              <TabsTrigger value="cancelled">ملغي</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative max-w-md flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالرقم، المنصة، السائق..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="w-48">
              <Combobox
                options={cityOptions}
                value={cityFilter}
                onValueChange={setCityFilter}
                placeholder="كل المدن"
                searchPlaceholder="ابحث عن مدينة..."
                emptyMessage="لا توجد مدن"
              />
            </div>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </CardHeader>
        <CardContent>
          <BulkActions
            selectedIds={selected}
            totalCount={allFiltered.length}
            onClear={clear}
            onSelectAll={() => selectAll(allFiltered.map(o => o.id))}
            actions={[
              { label: "تحديث الحالة", icon: RefreshCw, onClick: (ids) => { toast.info(`تحديث ${ids.length} طلب`) } },
              { label: "تصدير المحدد", icon: Download, onClick: (ids) => { const sel = orders.filter(o => ids.includes(o.id)); exportToExcel(sel.map(o => ({ "رقم الطلب": o.id, المنصة: o.platform, السائق: o.driver, المدينة: o.city, المبلغ: o.amount, الحالة: o.status })), "selected-orders", "الطلبات"); clear(); } },
              { label: "إلغاء الطلبات", icon: XCircle, onClick: (ids) => { setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status: "cancelled" } : o)); toast.success(`تم إلغاء ${ids.length} طلب`); clear(); }, destructive: true },
            ]}
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={allFiltered.length > 0 && selected.size === allFiltered.length} onChange={() => selected.size === allFiltered.length ? clear() : selectAll(allFiltered.map(o => o.id))} style={{ accentColor: "var(--con-brand, #3b82f6)" }} />
                  </TableHead>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">المنصة</TableHead>
                  <TableHead className="text-right">السائق</TableHead>
                  <TableHead className="text-right">المدينة</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الوقت</TableHead>
                  <TableHead className="text-right w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status];
                  return (
                    <TableRow key={order.id} className="hover:bg-muted/30">
                      <TableCell className="w-10">
                        <input type="checkbox" checked={isSelected(order.id)} onChange={() => toggle(order.id)} style={{ accentColor: "var(--con-brand, #3b82f6)" }} />
                      </TableCell>
                      <TableCell className="font-mono text-sm font-bold">
                        {order.id}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.platform}
                      </TableCell>
                      <TableCell className="text-sm">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <span className="cursor-pointer hover:underline">
                              {order.driver}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-56" side="left">
                            <div className="flex gap-3">
                              <Avatar className="w-9 h-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                  {order.driver.split(" ")[0]?.[0] || "?"}
                                  {order.driver.split(" ")[1]?.[0] || ""}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <p className="text-sm font-semibold">
                                  {order.driver}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {order.city}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {order.platform}
                                </p>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {order.city}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {order.amount} ر.س
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={status.variant}
                          className="text-[10px] gap-1"
                        >
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {order.time}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="w-3.5 h-3.5 ml-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(order)}>
                              <Pencil className="w-3.5 h-3.5 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info(`تتبع الطلب ${order.id}`)
                              }
                            >
                              تتبع الطلب
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  إلغاء الطلب
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    إلغاء الطلب {order.id}؟
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن
                                    التراجع عن هذا الإجراء.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                  <AlertDialogCancel>تراجع</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={async () => {
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "cancelled" } : o));
                                      if (supabase) {
                                        const { error } = await supabase
                                          .from("orders")
                                          .update({ status: "cancelled" })
                                          .eq("id", order.id);
                                        if (error) {
                                          console.error("[AdminOrders] cancel error:", error);
                                          toast.error("تم الإلغاء محلياً — تعذّر تحديث السيرفر");
                                          return;
                                        }
                                      }
                                      toast.success(`تم إلغاء الطلب ${order.id}`);
                                    }}
                                  >
                                    إلغاء الطلب
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredOrders.length === 0 && (
            <Empty className="py-12">
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>لا توجد طلبات</EmptyTitle>
            </Empty>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-xs text-muted-foreground">
                عرض {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, allFiltered.length)} من{" "}
                {allFiltered.length}
              </span>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={
                        page <= 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setPage(i + 1)}
                        isActive={page === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={
                        page >= totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Order Detail Drawer */}
      <Drawer
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DrawerContent dir="rtl">
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader>
              <DrawerTitle>تفاصيل الطلب {selectedOrder?.id}</DrawerTitle>
              <DrawerDescription>معلومات الطلب كاملة</DrawerDescription>
            </DrawerHeader>
            {selectedOrder && (
              <div className="px-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">المنصة:</span>{" "}
                    <strong>{selectedOrder.platform}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">العميل:</span>{" "}
                    <strong>{selectedOrder.customer}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">السائق:</span>{" "}
                    <strong>{selectedOrder.driver}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">المدينة:</span>{" "}
                    <strong>{selectedOrder.city}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">المبلغ:</span>{" "}
                    <strong>{selectedOrder.amount} ر.س</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">التاريخ:</span>{" "}
                    <strong>{selectedOrder.date}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الوقت:</span>{" "}
                    <strong>{selectedOrder.time}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الحالة:</span>{" "}
                    <Badge
                      variant={statusConfig[selectedOrder.status]?.variant}
                    >
                      {statusConfig[selectedOrder.status]?.label}
                    </Badge>
                  </div>
                </div>
                <Separator />
              </div>
            )}
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">إغلاق</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--con-bg-surface-1, #fff)",
              border: "1px solid var(--con-border-default, #e5e7eb)",
              borderRadius: 12,
              padding: 24,
              width: 420,
              maxWidth: "90vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--con-text-primary, #111)",
                  margin: 0,
                }}
              >
                {editingItem ? "تعديل الطلب" : "إضافة طلب"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--con-text-muted, #888)",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--con-text-secondary, #555)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  العميل
                </label>
                <input
                  className="con-input"
                  value={form.customer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer: e.target.value }))
                  }
                  placeholder="اسم العميل"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--con-border-default, #e5e7eb)",
                    fontSize: 13,
                    background: "var(--con-bg-surface-2, #f9fafb)",
                    color: "var(--con-text-primary, #111)",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--con-text-secondary, #555)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  المنصة
                </label>
                <select
                  value={form.platform}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, platform: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--con-border-default, #e5e7eb)",
                    fontSize: 13,
                    background: "var(--con-bg-surface-2, #f9fafb)",
                    color: "var(--con-text-primary, #111)",
                  }}
                >
                  {[
                    "جاهز",
                    "هنقرستيشن",
                    "مرسول",
                    "نون فود",
                    "طلبات",
                    "كريم",
                  ].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--con-text-secondary, #555)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  السائق
                </label>
                <input
                  className="con-input"
                  value={form.driver}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, driver: e.target.value }))
                  }
                  placeholder="اسم السائق (اختياري)"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--con-border-default, #e5e7eb)",
                    fontSize: 13,
                    background: "var(--con-bg-surface-2, #f9fafb)",
                    color: "var(--con-text-primary, #111)",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--con-text-secondary, #555)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  المدينة
                </label>
                <select
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--con-border-default, #e5e7eb)",
                    fontSize: 13,
                    background: "var(--con-bg-surface-2, #f9fafb)",
                    color: "var(--con-text-primary, #111)",
                  }}
                >
                  {["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر"].map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--con-text-secondary, #555)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  ملاحظات
                </label>
                <textarea
                  className="con-input"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="ملاحظات إضافية..."
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--con-border-default, #e5e7eb)",
                    fontSize: 13,
                    background: "var(--con-bg-surface-2, #f9fafb)",
                    color: "var(--con-text-primary, #111)",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
                justifyContent: "flex-start",
              }}
            >
              <button
                onClick={handleSave}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 20px",
                  borderRadius: 8,
                  background: "var(--con-brand, #3b82f6)",
                  color: "#fff",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Save size={14} />
                {editingItem ? "حفظ التعديل" : "إضافة"}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  background: "var(--con-bg-surface-2, #f3f4f6)",
                  color: "var(--con-text-secondary, #555)",
                  border: "1px solid var(--con-border-default, #e5e7eb)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
