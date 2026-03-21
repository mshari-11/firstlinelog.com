/**
 * هوكس لجلب بيانات الموقع من Supabase
 * في حالة عدم توفر الاتصال، يتم استخدام البيانات الثابتة كبديل
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  METRICS,
  PLATFORMS,
  CITIES,
  SERVICES,
  WHY_FIRST_LINE,
} from "@/data/index";
import type { MetricData, PlatformData, CityData } from "@/lib/index";
import type { ServiceData, BenefitData } from "@/data/index";

/**
 * جلب المقاييس والإحصائيات من جدول metrics
 */
export function useMetrics() {
  return useQuery<MetricData[]>({
    queryKey: ["metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metrics")
        .select("*")
        .order("id");

      if (error || !data || data.length === 0) return METRICS;
      return data;
    },
    placeholderData: METRICS,
  });
}

/**
 * جلب المنصات الشريكة من جدول platforms
 */
export function usePlatforms() {
  return useQuery<PlatformData[]>({
    queryKey: ["platforms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platforms")
        .select("*")
        .order("id");

      if (error || !data || data.length === 0) return PLATFORMS;
      return data;
    },
    placeholderData: PLATFORMS,
  });
}

/**
 * جلب المدن التشغيلية من جدول cities
 */
export function useCities() {
  return useQuery<CityData[]>({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name");

      if (error || !data || data.length === 0) return CITIES;
      return data;
    },
    placeholderData: CITIES,
  });
}

/**
 * جلب الخدمات من جدول services
 */
export function useServices() {
  return useQuery<ServiceData[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("id");

      if (error || !data || data.length === 0) return SERVICES;
      return data;
    },
    placeholderData: SERVICES,
  });
}

/**
 * جلب المزايا التنافسية من جدول benefits
 */
export function useBenefits() {
  return useQuery<BenefitData[]>({
    queryKey: ["benefits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefits")
        .select("*")
        .order("id");

      if (error || !data || data.length === 0) return WHY_FIRST_LINE;
      return data;
    },
    placeholderData: WHY_FIRST_LINE,
  });
}

/**
 * جلب إعدادات الموقع من جدول site_config
 */
export function useSiteConfig() {
  return useQuery<Record<string, string>>({
    queryKey: ["site_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_config")
        .select("key, value");

      if (error || !data || data.length === 0) return {};
      return Object.fromEntries(data.map((row) => [row.key, row.value]));
    },
    placeholderData: {},
  });
}
