/**
 * FLL Marketplace Integrations Module v1.0
 * يربط خدمات AWS Marketplace بالمشروع
 * 
 * 1. Nected — محرك قواعد المالية (العمولات، الخصومات، الحوافز)
 * 2. Veri5now — تحقق هوية السائقين (eKYC)
 * 3. AI Financial Report Analyst — تحليل التقارير المالية
 * 4. Turiya AI — أتمتة agents ذكاء اصطناعي
 */

const INTEGRATIONS = {
  nected: {
    name: 'Nected Decision Platform',
    purpose: 'محرك قواعد الأعمال المالية',
    status: 'active',
    use_cases: [
      'حساب عمولة السائق حسب المنصة والمدينة',
      'تحديد الحوافز بناءً على عدد التوصيلات',
      'قواعد الخصم (مخالفات، تأخير، إلغاء)',
      'حد أدنى/أقصى للدفعات',
      'قواعد SLA مالية'
    ],
    integration_point: 'staff-finance.html + Step Functions',
    config_key: 'marketplace-nected'
  },
  veri5now: {
    name: 'Veri5now eKYC',
    purpose: 'تحقق من هوية السائقين',
    status: 'active',
    use_cases: [
      'التحقق من الهوية الوطنية للسائق',
      'التحقق من رخصة القيادة',
      'التوقيع الإلكتروني على عقد العمل',
      'مطابقة صورة السائق مع الهوية'
    ],
    integration_point: 'courier-dashboard.html (KYC tab) + staff-hr.html',
    config_key: 'marketplace-veri5now'
  },
  ai_finance: {
    name: 'AI Financial Report Analyst',
    purpose: 'تحليل التقارير المالية بالذكاء الاصطناعي',
    status: 'active',
    use_cases: [
      'تحليل أرباح السائقين الأسبوعية/الشهرية',
      'كشف الأنماط المالية غير الطبيعية',
      'توقعات الإيرادات',
      'تحليل أداء المنصات (HungerStation vs Keeta vs Ninja...)',
      'تقارير مالية تلقائية للإدارة'
    ],
    integration_point: 'admin-dashboard.html (AI Review) + staff-finance.html',
    config_key: 'marketplace-ai-finance'
  },
  turiya: {
    name: 'Turiya AI',
    purpose: 'منصة أتمتة agents ذكاء اصطناعي',
    status: 'active',
    use_cases: [
      'Agent تصنيف الشكاوى تلقائياً',
      'Agent متابعة حالة الطلبات',
      'Agent الرد على استفسارات السائقين',
      'Agent مراجعة المستندات (KYC)'
    ],
    integration_point: 'fll-chat-widget.js + complaints system',
    config_key: 'marketplace-turiya'
  }
};

module.exports = { INTEGRATIONS };
