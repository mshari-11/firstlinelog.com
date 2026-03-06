/**
 * صفحة مستحقات السائق - Driver Entitlements
 * تظهر فقط المستحقات التي تم صرفها من قِبَل المالية
 * FirstLine Logistics
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeDollarSign,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Building2,
  Mail,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface EntitlementRecord {
  id: string;
  month_label: string;
  gross_amount: number;
  platform_deductions: number;
  vehicle_deduction: number;
  absence_deduction: number;
  maintenance_deduction: number;
  insurance_deduction: number;
  other_deductions: number;
  net_amount: number;
  payment_status: "paid";
  paid_at: string;
  notes?: string;
}

interface BankNotification {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("ar-SA")} ر.س`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DriverEntitlements() {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<EntitlementRecord[]>([]);
  const [notifications, setNotifications] = useState<BankNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntitlements();
    fetchNotifications();
  }, [user]);

  async function fetchEntitlements() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("finance")
        .select("*")
        .eq("courier_id", user.id)
        .eq("payment_status", "paid")
        .order("paid_at", { ascending: false });

      if (!error && data) {
        setEntitlements(data as EntitlementRecord[]);
      }
    } catch (err) {
      console.error("خطأ في جلب المستحقات:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNotifications() {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from("driver_notifications")
        .select("*")
        .eq("driver_id", user.id)
        .eq("type", "bank_error")
        .eq("read", false)
        .order("created_at", { ascending: false });
      if (data) setNotifications(data);
    } catch (err) {
      // تجاهل الخطأ إذا لم يكن الجدول موجودًا
    }
  }

  async function markNotificationRead(notifId: string) {
    await supabase
      .from("driver_notifications")
      .update({ read: true })
      .eq("id", notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  }

  const totalPaid = entitlements.reduce((sum, e) => sum + e.net_amount, 0);
  const totalDeductions = entitlements.reduce(
    (sum, e) =>
      sum +
      e.platform_deductions +
      e.vehicle_deduction +
      e.absence_deduction +
      e.maintenance_deduction +
      e.insurance_deduction +
      e.other_deductions,
    0
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* العنوان */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BadgeDollarSign className="w-6 h-6 text-emerald-600" />
            مستحقاتي
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            المستحقات المصروفة من قِبَل قسم المالية
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEntitlements}>
          <RefreshCw className="w-4 h-4 ml-2" />
          تحديث
        </Button>
      </motion.div>

      {/* تنبيه الحساب البنكي */}
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            variants={item}
          >
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-800 text-sm mb-1">تنبيه: مشكلة في الحساب البنكي</p>
                <p className="text-red-700 text-sm">{notif.message}</p>
                <div className="flex items-center gap-3 mt-3">
                  <a
                    href="mailto:support@fll.sa"
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-medium underline"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    support@fll.sa
                  </a>
                  <span className="text-red-300">|</span>
                  <a
                    href="tel:+966"
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    مراجعة الإدارة
                  </a>
                </div>
              </div>
              <button
                onClick={() => markNotificationRead(notif.id)}
                className="text-red-400 hover:text-red-600 text-xs p-1"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* الإحصائيات */}
      {entitlements.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div variants={item}>
            <Card>
              <CardContent className="p-4">
                <div className="p-2 rounded-lg bg-emerald-50 w-fit mb-3">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xl font-bold font-mono text-emerald-600">{formatCurrency(totalPaid)}</p>
                <p className="text-xs text-muted-foreground mt-1">إجمالي المستحقات المصروفة</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card>
              <CardContent className="p-4">
                <div className="p-2 rounded-lg bg-blue-50 w-fit mb-3">
                  <TrendingDown className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xl font-bold font-mono">{formatCurrency(totalDeductions)}</p>
                <p className="text-xs text-muted-foreground mt-1">إجمالي الاستقطاعات</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card>
              <CardContent className="p-4">
                <div className="p-2 rounded-lg bg-purple-50 w-fit mb-3">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-xl font-bold font-mono">{entitlements.length}</p>
                <p className="text-xs text-muted-foreground mt-1">عدد الدفعات المصروفة</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* قائمة المستحقات */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground text-sm">جاري تحميل المستحقات...</p>
          </div>
        </div>
      ) : entitlements.length === 0 ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">لا توجد مستحقات مصروفة بعد</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  ستظهر مستحقاتك هنا بعد أن يقوم قسم المالية بصرفها وإرسال التفاصيل إليك.
                </p>
                <div className="pt-2">
                  <a
                    href="mailto:support@fll.sa"
                    className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    للاستفسار: support@fll.sa
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {entitlements.map((ent) => {
            const totalDeductionsForRecord =
              ent.platform_deductions +
              ent.vehicle_deduction +
              ent.absence_deduction +
              ent.maintenance_deduction +
              ent.insurance_deduction +
              ent.other_deductions;
            const isExpanded = expandedId === ent.id;

            return (
              <motion.div key={ent.id} variants={item}>
                <Card className="overflow-hidden">
                  {/* رأس البطاقة - قابل للنقر */}
                  <button
                    className="w-full text-right"
                    onClick={() => setExpandedId(isExpanded ? null : ent.id)}
                  >
                    <CardHeader className="pb-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-50">
                            <BadgeDollarSign className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold">
                              {ent.month_label || `مستحقات - ${formatDate(ent.paid_at)}`}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              تم الصرف في {formatDate(ent.paid_at)}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <p className="font-mono font-bold text-lg text-emerald-600">
                              {formatCurrency(ent.net_amount)}
                            </p>
                            <Badge className="bg-emerald-500 text-white text-[10px]">
                              <CheckCircle2 className="w-2.5 h-2.5 ml-1" />
                              مصروف
                            </Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {/* التفاصيل القابلة للتوسع */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <CardContent className="pt-0 pb-4">
                          <div className="border-t border-border pt-4 space-y-3">
                            {/* الإجمالي قبل الاستقطاعات */}
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                <span className="font-medium">إجمالي المبلغ</span>
                              </div>
                              <span className="font-mono font-bold">{formatCurrency(ent.gross_amount)}</span>
                            </div>

                            {/* الاستقطاعات */}
                            <div className="bg-muted/30 rounded-xl p-4 space-y-2.5">
                              <p className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                                الاستقطاعات
                              </p>

                              {ent.platform_deductions > 0 && (
                                <DeductionRow label="عمولة المنصة" amount={ent.platform_deductions} />
                              )}
                              {ent.vehicle_deduction > 0 && (
                                <DeductionRow label="استقطاع المركبة" amount={ent.vehicle_deduction} />
                              )}
                              {ent.absence_deduction > 0 && (
                                <DeductionRow label="استقطاع الغياب" amount={ent.absence_deduction} />
                              )}
                              {ent.maintenance_deduction > 0 && (
                                <DeductionRow label="صيانة" amount={ent.maintenance_deduction} />
                              )}
                              {ent.insurance_deduction > 0 && (
                                <DeductionRow label="تأمين" amount={ent.insurance_deduction} />
                              )}
                              {ent.other_deductions > 0 && (
                                <DeductionRow label="استقطاعات أخرى" amount={ent.other_deductions} />
                              )}

                              {totalDeductionsForRecord === 0 && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Minus className="w-3.5 h-3.5" />
                                  لا توجد استقطاعات
                                </div>
                              )}

                              <div className="pt-2 border-t border-border flex items-center justify-between text-sm font-medium">
                                <span>إجمالي الاستقطاعات</span>
                                <span className="font-mono text-red-500">
                                  - {formatCurrency(totalDeductionsForRecord)}
                                </span>
                              </div>
                            </div>

                            {/* صافي المستحق */}
                            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                              <span className="font-bold text-sm text-emerald-800">صافي المستحق</span>
                              <span className="font-mono font-bold text-emerald-700 text-lg">
                                {formatCurrency(ent.net_amount)}
                              </span>
                            </div>

                            {ent.notes && (
                              <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                                <span className="font-medium">ملاحظة: </span>
                                {ent.notes}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* معلومات الدعم */}
      <motion.div variants={item}>
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4 px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">للاستفسار عن مستحقاتك</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تواصل مع قسم المالية أو الدعم على:{" "}
                  <a href="mailto:support@fll.sa" className="text-emerald-600 hover:underline font-medium">
                    support@fll.sa
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function DeductionRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-red-500">- {amount.toLocaleString("ar-SA")} ر.س</span>
    </div>
  );
}
