/**
 * ثوابت المسارات والأنواع والوظائف المساعدة لموقع فيرست لاين لوجستيكس (First Line Logistics)
 * الإصدار: 2026
 */

export const ROUTE_PATHS = {
  HOME: "/",
  ABOUT: "/about",
  SERVICES: "/services",
  SERVICE_DETAILS: "/services/:serviceId",
  PLATFORMS: "/platforms",
  GOVERNANCE: "/governance",
  INVESTORS: "/investors",
  NEWS: "/news",
  JOIN_US: "/join-us",
  CONTACT: "/contact",
  TEAM: "/team",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  FAQ: "/faq",
  LOGIN: "/login",
  UNIFIED_LOGIN: "/unified-login",
  COMPLIANCE: "/compliance",
  // Admin Dashboard
  ADMIN: "/admin",
  ADMIN_DRIVERS: "/admin/drivers",
  ADMIN_ORDERS: "/admin/orders",
  ADMIN_REPORTS: "/admin/reports",
  // Driver Dashboard
  DRIVER: "/driver",
  DRIVER_ORDERS: "/driver/orders",
  DRIVER_EARNINGS: "/driver/earnings",
  DRIVER_ENTITLEMENTS: "/driver/entitlements",
  DRIVER_PROFILE: "/driver/profile",
  // Admin Panel (Full)
  ADMIN_PANEL: "/admin-panel/dashboard",
  ADMIN_PANEL_FINANCE: "/admin-panel/finance",
  ADMIN_PANEL_COURIERS: "/admin-panel/couriers",
  ADMIN_PANEL_ORDERS: "/admin-panel/orders",
  ADMIN_PANEL_STAFF: "/admin-panel/staff",
  ADMIN_PANEL_REPORTS: "/admin-panel/reports",
  ADMIN_PANEL_COMPLAINTS: "/admin-panel/complaints",
  ADMIN_PANEL_VEHICLES: "/admin-panel/vehicles",
  ADMIN_PANEL_SETTINGS: "/admin-panel/settings",
  ADMIN_PANEL_EXCEL: "/admin-panel/excel",
} as const;

/**
 * بيانات المقاييس والإحصائيات
 */
export interface MetricData {
  label: string;
  value: string | number;
  suffix?: string;
  description?: string;
  icon?: string;
}

/**
 * بيانات منصات التوصيل الشريكة
 */
export interface PlatformData {
  id: string;
  name: string;
  category?: string;
  logo?: string;
  coming_soon?: boolean;
}

/**
 * بيانات المدن التي نعمل بها
 */
export interface CityData {
  name: string;
  region: string;
}

/**
 * أنواع الاستفسارات في نموذج الاتصال
 */
export type InquiryType = "Platform" | "Investor" | "Fleet" | "General";

/**
 * بيانات نموذج الاتصال
 */
export interface ContactFormData {
  name: string;
  company: string;
  inquiryType: InquiryType;
  city: string;
  message: string;
}

/**
 * تنسيق الأرقام كعملة بالريال السعودي
 * يستخدم التنسيق العربي المحلي
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * تنسيق الأرقام الكبيرة بشكل مختصر (مثل: 35 ألف)
 */
export const formatCompactNumber = (value: number): string => {
  return new Intl.NumberFormat("ar-SA", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
};

/**
 * السنة الحالية لإشعارات حقوق النشر والمستندات الرسمية
 */
export const CURRENT_YEAR = 2026;

/**
 * تعريف هيكل بيانات الخدمة
 */
export interface ServiceData {
  title: string;
  description: string;
  iconName: string;
}

/**
 * تعريف هيكل بيانات المزايا والقيم
 */
export interface BenefitData {
  title: string;
  description: string;
}
