/**
 * صفحة طلبات السائق - Driver Orders
 * FirstLine Logistics
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Navigation,
  Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ordersData = [
  { id: "FLL-10847", restaurant: "مطاعم البيك", pickup: "حي الروضة، جدة", destination: "حي النزهة، جدة", status: "picked_up", time: "14:35", amount: 45, distance: "4.2 كم" },
  { id: "FLL-10846", restaurant: "ماكدونالدز", pickup: "طريق الملك فهد", destination: "حي الصفا، جدة", status: "pending", time: "14:40", amount: 38, distance: "3.1 كم" },
  { id: "FLL-10845", restaurant: "شاورمر", pickup: "حي الشرفية", destination: "حي الحمراء، جدة", status: "pending", time: "14:45", amount: 29, distance: "2.8 كم" },
  { id: "FLL-10840", restaurant: "هرفي", pickup: "حي الزهراء", destination: "حي البوادي، جدة", status: "delivered", time: "13:20", amount: 52, distance: "5.6 كم" },
  { id: "FLL-10835", restaurant: "كودو", pickup: "حي المرجان", destination: "حي الفيصلية، جدة", status: "delivered", time: "12:45", amount: 35, distance: "3.9 كم" },
  { id: "FLL-10830", restaurant: "بيتزا هت", pickup: "حي السلامة", destination: "حي الرحاب، جدة", status: "delivered", time: "11:30", amount: 68, distance: "6.2 كم" },
  { id: "FLL-10825", restaurant: "مطاعم البيك", pickup: "حي النعيم", destination: "حي الأندلس، جدة", status: "cancelled", time: "10:15", amount: 42, distance: "4.5 كم" },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "جديد", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200", icon: Package },
  picked_up: { label: "تم الاستلام", color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200", icon: Truck },
  delivered: { label: "تم التسليم", color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  cancelled: { label: "ملغي", color: "text-red-600", bgColor: "bg-red-50 border-red-200", icon: XCircle },
};

export default function DriverOrders() {
  const [tab, setTab] = useState("active");

  const filteredOrders = ordersData.filter((o) => {
    if (tab === "active") return o.status === "pending" || o.status === "picked_up";
    if (tab === "completed") return o.status === "delivered";
    if (tab === "cancelled") return o.status === "cancelled";
    return true;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">طلباتي</h1>
        <p className="text-muted-foreground text-sm mt-1">إدارة ومتابعة جميع طلباتك</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">نشطة ({ordersData.filter((o) => o.status === "pending" || o.status === "picked_up").length})</TabsTrigger>
          <TabsTrigger value="completed">مكتملة ({ordersData.filter((o) => o.status === "delivered").length})</TabsTrigger>
          <TabsTrigger value="cancelled">ملغية ({ordersData.filter((o) => o.status === "cancelled").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const status = statusConfig[order.status];
          return (
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`border ${status.bgColor} hover:shadow-md transition-shadow`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                        <status.icon className={`w-5 h-5 ${status.color}`} />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-muted-foreground">{order.id}</span>
                        <p className="font-bold text-sm">{order.restaurant}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-mono font-bold text-emerald-600">{order.amount} ر.س</p>
                      <p className="text-[10px] text-muted-foreground">{order.distance}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">الاستلام من</p>
                        <p className="text-sm">{order.pickup}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">التسليم إلى</p>
                        <p className="text-sm">{order.destination}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {order.time}
                    </div>
                    {(order.status === "pending" || order.status === "picked_up") && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          <Phone className="w-3 h-3 ml-1" />
                          اتصال
                        </Button>
                        <Button size="sm" className="text-xs h-8 bg-emerald-500 hover:bg-emerald-600">
                          <Navigation className="w-3 h-3 ml-1" />
                          {order.status === "pending" ? "استلام الطلب" : "تأكيد التسليم"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد طلبات في هذا القسم</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
