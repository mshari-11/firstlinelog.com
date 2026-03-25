/**
 * صفحة إدارة السائقين - Admin Drivers Management
 * FirstLine Logistics
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  MapPin,
  Phone,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  UserPlus,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const driversData = [
  { id: "DRV-001", name: "أحمد محمد الغامدي", phone: "05XXXXXXX1", city: "جدة", platform: "هنقرستيشن", status: "active", rating: 4.8, orders: 1247, joinDate: "2024-03" },
  { id: "DRV-002", name: "خالد علي القحطاني", phone: "05XXXXXXX2", city: "الرياض", platform: "جاهز", status: "active", rating: 4.9, orders: 982, joinDate: "2024-05" },
  { id: "DRV-003", name: "سعد ناصر العتيبي", phone: "05XXXXXXX3", city: "جدة", platform: "مرسول", status: "inactive", rating: 4.5, orders: 654, joinDate: "2024-07" },
  { id: "DRV-004", name: "فهد أحمد الشهري", phone: "05XXXXXXX4", city: "الدمام", platform: "نون فود", status: "active", rating: 4.7, orders: 1580, joinDate: "2023-11" },
  { id: "DRV-005", name: "عمر سعيد الحربي", phone: "05XXXXXXX5", city: "مكة", platform: "هنقرستيشن", status: "suspended", rating: 3.9, orders: 320, joinDate: "2025-01" },
  { id: "DRV-006", name: "محمد يوسف الزهراني", phone: "05XXXXXXX6", city: "الرياض", platform: "جاهز", status: "active", rating: 4.6, orders: 890, joinDate: "2024-08" },
  { id: "DRV-007", name: "عبدالله سالم المالكي", phone: "05XXXXXXX7", city: "المدينة", platform: "مرسول", status: "active", rating: 4.8, orders: 1120, joinDate: "2024-01" },
  { id: "DRV-008", name: "ياسر حسن الدوسري", phone: "05XXXXXXX8", city: "جدة", platform: "هنقرستيشن", status: "pending", rating: 0, orders: 0, joinDate: "2026-02" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  active: { label: "نشط", variant: "default", icon: CheckCircle2 },
  inactive: { label: "غير نشط", variant: "secondary", icon: XCircle },
  suspended: { label: "موقوف", variant: "destructive", icon: XCircle },
  pending: { label: "قيد المراجعة", variant: "outline", icon: Clock },
};

const summaryStats = [
  { label: "إجمالي السائقين", value: "2,847", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "نشط الآن", value: "2,120", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "قيد المراجعة", value: "83", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "موقوف", value: "45", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
];

export default function AdminDrivers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredDrivers = driversData.filter((d) => {
    const matchSearch = d.name.includes(search) || d.id.includes(search) || d.city.includes(search);
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* العنوان */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة السائقين</h1>
          <p className="text-muted-foreground text-sm mt-1">عرض وإدارة جميع قادة المركبات المسجلين</p>
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
          <Button size="sm">
            <UserPlus className="w-4 h-4 ml-2" />
            إضافة سائق
          </Button>
        </div>
      </div>

      {/* ملخص الإحصائيات */}
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
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، الكود، أو المدينة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  الحالة
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>الكل</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")}>نشط</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>غير نشط</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("suspended")}>موقوف</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pending")}>قيد المراجعة</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">السائق</TableHead>
                  <TableHead className="text-right">المدينة</TableHead>
                  <TableHead className="text-right">المنصة</TableHead>
                  <TableHead className="text-right">التقييم</TableHead>
                  <TableHead className="text-right">الطلبات</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => {
                  const status = statusConfig[driver.status];
                  return (
                    <TableRow key={driver.id} className="hover:bg-muted/30">
                      <TableCell>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="flex items-center gap-3 cursor-pointer">
                              <Avatar className="w-9 h-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                  {driver.name.split(" ")[0][0]}{driver.name.split(" ")[1]?.[0] || ""}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm hover:underline">{driver.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{driver.id}</p>
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-72" side="left">
                            <div className="flex gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                  {driver.name.split(" ")[0][0]}{driver.name.split(" ")[1]?.[0] || ""}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1 flex-1">
                                <p className="text-sm font-semibold">{driver.name}</p>
                                <p className="text-xs text-muted-foreground">{driver.phone}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{driver.city}</span>
                                  <span>{driver.platform}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs pt-1">
                                  {driver.rating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" />{driver.rating}</span>}
                                  <span className="font-mono">{driver.orders.toLocaleString("ar-SA")} طلب</span>
                                  <span>منذ {driver.joinDate}</span>
                                </div>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {driver.city}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{driver.platform}</TableCell>
                      <TableCell>
                        {driver.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-mono font-medium">{driver.rating}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{driver.orders.toLocaleString("ar-SA")}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="text-[10px] gap-1">
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem>عرض الملف</DropdownMenuItem>
                            <DropdownMenuItem>تعديل البيانات</DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-500" onSelect={(e) => e.preventDefault()}>إيقاف السائق</DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>إيقاف السائق {driver.name}؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    سيتم إيقاف السائق عن استقبال الطلبات. يمكنك إعادة تفعيله لاحقاً.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => toast.success(`تم إيقاف ${driver.name}`)}>
                                    إيقاف
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
