/**
 * صفحة إدارة الطلبات - Admin Orders Management
 * FirstLine Logistics
 */
import { useState } from "react";
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
  Drawer, DrawerClose, DrawerContent, DrawerDescription,
  DrawerFooter, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Combobox } from "@/components/ui/combobox";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Inbox } from "lucide-react";

const ordersData = [
  { id: "FLL-10847", platform: "هنقرستيشن", customer: "عميل #4821", driver: "أحمد محمد", city: "جدة", status: "delivered", amount: 45, date: "2026-02-20", time: "14:35" },
  { id: "FLL-10846", platform: "جاهز", customer: "عميل #3290", driver: "خالد علي", city: "الرياض", status: "in_transit", amount: 62, date: "2026-02-20", time: "14:28" },
  { id: "FLL-10845", platform: "مرسول", customer: "عميل #7156", driver: "سعد ناصر", city: "جدة", status: "picked_up", amount: 38, date: "2026-02-20", time: "14:15" },
  { id: "FLL-10844", platform: "نون فود", customer: "عميل #9432", driver: "—", city: "الدمام", status: "pending", amount: 55, date: "2026-02-20", time: "14:08" },
  { id: "FLL-10843", platform: "هنقرستيشن", customer: "عميل #2187", driver: "عمر سعيد", city: "مكة", status: "delivered", amount: 29, date: "2026-02-20", time: "13:55" },
  { id: "FLL-10842", platform: "جاهز", customer: "عميل #6743", driver: "فهد أحمد", city: "الرياض", status: "cancelled", amount: 42, date: "2026-02-20", time: "13:40" },
  { id: "FLL-10841", platform: "مرسول", customer: "عميل #8901", driver: "محمد يوسف", city: "جدة", status: "delivered", amount: 71, date: "2026-02-20", time: "13:22" },
  { id: "FLL-10840", platform: "هنقرستيشن", customer: "عميل #1567", driver: "عبدالله سالم", city: "المدينة", status: "in_transit", amount: 36, date: "2026-02-20", time: "13:10" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  delivered: { label: "تم التسليم", variant: "default", icon: CheckCircle2 },
  in_transit: { label: "في الطريق", variant: "secondary", icon: Truck },
  picked_up: { label: "تم الاستلام", variant: "outline", icon: Package },
  pending: { label: "قيد الانتظار", variant: "outline", icon: Clock },
  cancelled: { label: "ملغي", variant: "destructive", icon: XCircle },
};

const summaryStats = [
  { label: "طلبات اليوم", value: "847", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "تم التسليم", value: "692", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "في الطريق", value: "98", icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "ملغي", value: "12", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
];

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<typeof ordersData[0] | null>(null);
  const [cityFilter, setCityFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const cityOptions = [...new Set(ordersData.map(o => o.city))].map(c => ({ value: c, label: c }));

  const allFiltered = ordersData.filter((o) => {
    const matchSearch = o.id.includes(search) || o.platform.includes(search) || o.driver.includes(search) || o.city.includes(search);
    const matchTab = tab === "all" || o.status === tab;
    const matchCity = !cityFilter || o.city === cityFilter;
    return matchSearch && matchTab && matchCity;
  });
  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
  const filteredOrders = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* العنوان */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
          <p className="text-muted-foreground text-sm mt-1">تتبع وإدارة جميع طلبات التوصيل</p>
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
              <DropdownMenuItem><FileSpreadsheet className="w-3.5 h-3.5 ml-2" />تصدير Excel</DropdownMenuItem>
              <DropdownMenuItem><FileText className="w-3.5 h-3.5 ml-2" />تصدير PDF</DropdownMenuItem>
              <DropdownMenuItem><Download className="w-3.5 h-3.5 ml-2" />تصدير CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                      <TableCell className="font-mono text-sm font-bold">{order.id}</TableCell>
                      <TableCell className="text-sm">{order.platform}</TableCell>
                      <TableCell className="text-sm">{order.driver}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {order.city}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{order.amount} ر.س</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="text-[10px] gap-1">
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{order.time}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => setSelectedOrder(order)}><Eye className="w-3.5 h-3.5 ml-2" />عرض التفاصيل</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info(`تتبع الطلب ${order.id}`)}>تتبع الطلب</DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-500" onSelect={(e) => e.preventDefault()}>إلغاء الطلب</DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>إلغاء الطلب {order.id}؟</AlertDialogTitle>
                                  <AlertDialogDescription>هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                  <AlertDialogCancel>تراجع</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => toast.success(`تم إلغاء الطلب ${order.id}`)}>إلغاء الطلب</AlertDialogAction>
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
              <EmptyMedia variant="icon"><Inbox /></EmptyMedia>
              <EmptyTitle>لا توجد طلبات</EmptyTitle>
            </Empty>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-xs text-muted-foreground">عرض {(page-1)*PAGE_SIZE+1}-{Math.min(page*PAGE_SIZE,allFiltered.length)} من {allFiltered.length}</span>
              <Pagination>
                <PaginationContent>
                  <PaginationItem><PaginationPrevious onClick={() => setPage(p => Math.max(1, p-1))} className={page<=1?"pointer-events-none opacity-50":"cursor-pointer"} /></PaginationItem>
                  {Array.from({length: totalPages}, (_, i) => (
                    <PaginationItem key={i}><PaginationLink onClick={() => setPage(i+1)} isActive={page===i+1} className="cursor-pointer">{i+1}</PaginationLink></PaginationItem>
                  ))}
                  <PaginationItem><PaginationNext onClick={() => setPage(p => Math.min(totalPages, p+1))} className={page>=totalPages?"pointer-events-none opacity-50":"cursor-pointer"} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Order Detail Drawer */}
      <Drawer open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DrawerContent dir="rtl">
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader>
              <DrawerTitle>تفاصيل الطلب {selectedOrder?.id}</DrawerTitle>
              <DrawerDescription>معلومات الطلب كاملة</DrawerDescription>
            </DrawerHeader>
            {selectedOrder && (
              <div className="px-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">المنصة:</span> <strong>{selectedOrder.platform}</strong></div>
                  <div><span className="text-muted-foreground">العميل:</span> <strong>{selectedOrder.customer}</strong></div>
                  <div><span className="text-muted-foreground">السائق:</span> <strong>{selectedOrder.driver}</strong></div>
                  <div><span className="text-muted-foreground">المدينة:</span> <strong>{selectedOrder.city}</strong></div>
                  <div><span className="text-muted-foreground">المبلغ:</span> <strong>{selectedOrder.amount} ر.س</strong></div>
                  <div><span className="text-muted-foreground">التاريخ:</span> <strong>{selectedOrder.date}</strong></div>
                  <div><span className="text-muted-foreground">الوقت:</span> <strong>{selectedOrder.time}</strong></div>
                  <div>
                    <span className="text-muted-foreground">الحالة:</span>{" "}
                    <Badge variant={statusConfig[selectedOrder.status]?.variant}>{statusConfig[selectedOrder.status]?.label}</Badge>
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
    </motion.div>
  );
}
