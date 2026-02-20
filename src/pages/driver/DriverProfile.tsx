/**
 * صفحة الملف الشخصي للسائق - Driver Profile
 * FirstLine Logistics
 */
import { motion } from "framer-motion";
import {
  User,
  Phone,
  MapPin,
  Car,
  Star,
  Calendar,
  Shield,
  CheckCircle2,
  FileText,
  Settings,
  Bell,
  Lock,
  CreditCard,
  Edit3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";

const driverProfile = {
  name: "أحمد محمد الغامدي",
  phone: "05XXXXXXX1",
  email: "ahmed@example.com",
  city: "جدة",
  joinDate: "مارس 2024",
  driverId: "DRV-001",
  platform: "هنقرستيشن",
  vehicle: "هيونداي أكسنت 2023",
  plateNumber: "أ ب ج 1234",
  licenseExpiry: "ديسمبر 2027",
  rating: 4.8,
  totalOrders: 1247,
  totalEarnings: "185,400 ر.س",
  status: "active",
};

const documents = [
  { name: "رخصة القيادة", status: "valid", expiry: "ديسمبر 2027" },
  { name: "استمارة المركبة", status: "valid", expiry: "يونيو 2026" },
  { name: "التأمين", status: "expiring", expiry: "مارس 2026" },
  { name: "الفحص الدوري", status: "valid", expiry: "أغسطس 2026" },
];

const docStatusConfig: Record<string, { label: string; variant: "default" | "destructive" | "outline" }> = {
  valid: { label: "ساري", variant: "default" },
  expiring: { label: "قارب على الانتهاء", variant: "outline" },
  expired: { label: "منتهي", variant: "destructive" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DriverProfile() {
  const { user } = useAuth();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">حسابي</h1>
        <p className="text-muted-foreground text-sm mt-1">إدارة بياناتك الشخصية وإعداداتك</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* البطاقة الشخصية */}
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                <AvatarFallback className="bg-emerald-500 text-white text-2xl font-bold">
                  {driverProfile.name[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-bold">{driverProfile.name}</h2>
              <p className="text-sm text-muted-foreground font-mono">{driverProfile.driverId}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-bold font-mono">{driverProfile.rating}</span>
              </div>
              <Badge className="mt-3 bg-emerald-500">نشط</Badge>

              <Separator className="my-5" />

              <div className="space-y-3 text-sm text-right">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{driverProfile.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{driverProfile.city}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Car className="w-4 h-4 text-muted-foreground" />
                  <span>{driverProfile.vehicle}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>انضم في {driverProfile.joinDate}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-5">
                <Edit3 className="w-4 h-4 ml-2" />
                تعديل البيانات
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="lg:col-span-2 space-y-6">
          {/* الإحصائيات */}
          <motion.div variants={item}>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-emerald-600">{driverProfile.totalOrders.toLocaleString("ar-SA")}</p>
                  <p className="text-xs text-muted-foreground mt-1">إجمالي الطلبات</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-primary">{driverProfile.totalEarnings}</p>
                  <p className="text-xs text-muted-foreground mt-1">إجمالي الأرباح</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-amber-600">{driverProfile.rating}</p>
                  <p className="text-xs text-muted-foreground mt-1">التقييم العام</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* المستندات */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  المستندات والوثائق
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {documents.map((doc) => {
                  const status = docStatusConfig[doc.status];
                  return (
                    <div key={doc.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">ينتهي: {doc.expiry}</p>
                        </div>
                      </div>
                      <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* الإعدادات */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  الإعدادات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">الإشعارات</p>
                      <p className="text-xs text-muted-foreground">تلقي إشعارات الطلبات الجديدة</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">الأمان</p>
                      <p className="text-xs text-muted-foreground">تغيير رقم الهاتف أو كلمة المرور</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">تعديل</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">الحساب البنكي</p>
                      <p className="text-xs text-muted-foreground">إدارة بيانات التحويل</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">تعديل</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
