/**
 * Staging Dashboard — بيئة الاختبار
 * Preview area for testing new features before production rollout.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Construction } from "lucide-react";

export default function StagingDashboard() {
  return (
    <div style={{ padding: "2rem", direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <FlaskConical style={{ width: 28, height: 28, color: "var(--con-brand)" }} />
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--con-font-primary)" }}>
          بيئة الاختبار
        </h1>
        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
          Staging
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Construction className="w-5 h-5 text-muted-foreground" />
            منطقة اختبار الميزات الجديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            هذه الصفحة مخصصة لاختبار الميزات الجديدة قبل نشرها في بيئة الإنتاج.
            يمكنك استخدام هذه المنطقة لمعاينة التغييرات والتحقق من جودتها.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
