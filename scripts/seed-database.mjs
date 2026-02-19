/**
 * سكريبت إدخال البيانات في Supabase
 * شغّله بالأمر: node scripts/seed-database.mjs
 *
 * ملاحظة: هذا السكريبت يستخدم Supabase REST API
 * يحتاج service_role key (مو anon key) لإنشاء الجداول
 * لكن يقدر يدخل البيانات إذا الجداول موجودة مسبقاً
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://djebhztfewjfyyoortvv.supabase.co';

// جرّب anon key أولاً، إذا ما نفع استخدم service_role
const KEY = process.argv[2] || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!KEY) {
  console.error('❌ أدخل المفتاح كمعامل:');
  console.error('   node scripts/seed-database.mjs <service_role_key>');
  console.error('');
  console.error('   تقدر تلقاه في: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, KEY);

const metrics = [
  { label: 'الطلبات السنوية', value: '6.4', suffix: 'مليون طلب+', description: 'حجم الطلبات المعالجة سنوياً عبر شبكتنا التشغيلية.', icon: 'PackageCheck' },
  { label: 'المدن التشغيلية', value: '18', suffix: 'مدينة', description: 'نطاق التغطية الجغرافية عبر المملكة العربية السعودية.', icon: 'MapPin' },
  { label: 'المنصات الشريكة', value: '7', suffix: 'منصات+', description: 'شراكات تشغيلية متعددة المنصات لضمان الاستقرار.', icon: 'Layers' },
  { label: 'الطلبات اليومية في الذروة', value: '35,000', suffix: 'طلب', description: 'القدرة التشغيلية القصوى خلال أوقات الذروة والمواسم.', icon: 'Zap' },
];

const platforms = [
  { id: 'p1', name: 'هنقرستيشن', category: 'توصيل طعام', logo: 'https://firstlinelog.skywork.website/images/%D8%AE%D8%AF%D9%85%D8%A9-%D8%A7%D9%84%D8%B9%D9%85%D9%84%D8%A7%D8%A1-%D9%87%D9%86%D9%82%D8%B1%D8%B3%D8%AA%D9%8A%D8%B4%D9%86.jpg', coming_soon: false },
  { id: 'p2', name: 'جاهز', category: 'توصيل طعام', logo: 'https://firstlinelog.skywork.website/images/images_5326.png', coming_soon: false },
  { id: 'p3', name: 'مرسول', category: 'توصيل كل شيء', logo: 'https://firstlinelog.skywork.website/images/%D8%B4%D8%B1%D9%83%D8%A7%D8%AA-%D8%AA%D9%88%D8%B5%D9%8A%D9%84-%D8%B7%D9%84%D8%A8%D8%A7%D8%AA-%D8%A7%D9%84%D9%85%D8%B7%D8%A7%D8%B9%D9%85-%D9%81%D9%8A-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9-1722690188-0.webp', coming_soon: false },
  { id: 'p4', name: 'ذا شيفز', category: 'توصيل طعام', logo: 'https://firstlinelog.skywork.website/images/%D8%A3%D8%B4%D9%87%D8%B1-10-%D8%AA%D8%B7%D8%A8%D9%8A%D9%82%D8%A7%D8%AA-%D8%AA%D9%88%D8%B5%D9%8A%D9%84-%D8%A7%D9%84%D8%B7%D8%B9%D8%A7%D9%85-%D9%81%D9%8A-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9-2025-%D8%AA%D8%B7%D8%A8%D9%8A%D9%82-The-chefz.jpg', coming_soon: false },
  { id: 'p5', name: 'نينجا', category: 'توصيل سريع', logo: 'https://firstlinelog.skywork.website/images/Gux53J6XkAAKnf4.png', coming_soon: false },
  { id: 'p6', name: 'تويو', category: 'خدمات لوجستية', logo: 'https://firstlinelog.skywork.website/images/images%20(1).png', coming_soon: false },
  { id: 'p7', name: 'كيتا', category: 'توصيل طعام', logo: 'https://firstlinelog.skywork.website/images/images.jpg', coming_soon: false },
  { id: 'p8', name: 'أمازون', category: 'تجارة إلكترونية', logo: 'https://firstlinelog.skywork.website/images/517hY12cdLL.jpg', coming_soon: true },
];

const cities = [
  { name: 'الرياض', region: 'الوسطى' },
  { name: 'جدة', region: 'الغربية' },
  { name: 'مكة المكرمة', region: 'الغربية' },
  { name: 'المدينة المنورة', region: 'الغربية' },
  { name: 'الدمام', region: 'الشرقية' },
  { name: 'الخبر', region: 'الشرقية' },
  { name: 'القصيم', region: 'الوسطى' },
  { name: 'أبها', region: 'الجنوبية' },
  { name: 'تبوك', region: 'الشمالية' },
  { name: 'حائل', region: 'الشمالية' },
  { name: 'جيزان', region: 'الجنوبية' },
  { name: 'نجران', region: 'الجنوبية' },
  { name: 'الجبيل', region: 'الشرقية' },
  { name: 'الهفوف', region: 'الشرقية' },
  { name: 'الخرج', region: 'الوسطى' },
  { name: 'ينبع', region: 'الغربية' },
];

const services = [
  { title: 'توصيل الميل الأخير (3PL)', description: 'حلول تنفيذ شاملة لمنصات التوصيل تضمن السرعة والدقة والاحترافية في الوصول للمستهلك.', iconName: 'Truck' },
  { title: 'إدارة الأساطيل والسائقين', description: 'إدارة متكاملة لآلاف السائقين وأساطيل المركبات لضمان استمرارية التشغيل على مدار الساعة.', iconName: 'Users' },
  { title: 'الجودة والامتثال (SLA)', description: 'الالتزام الصارم باتفاقيات مستوى الخدمة والمعايير التنظيمية لضمان تجربة مستخدم مثالية.', iconName: 'ShieldCheck' },
  { title: 'إدارة الذروة والمواسم', description: 'مرونة تشغيلية عالية وقدرة على التوسع السريع لتغطية الطلب المرتفع خلال المواسم والأعياد.', iconName: 'Zap' },
  { title: 'دعم التوسع الجغرافي', description: 'تسهيل دخول المنصات لمدن جديدة عبر بنية تحتية تشغيلية جاهزة وفريق عمل خبير.', iconName: 'Globe' },
];

const benefits = [
  { title: 'التحكم في التنفيذ', description: 'نحن لا نوسط الطلب - نحن ننفذه. السائقون والأساطيل والمناطق وإدارة الذروة وإنفاذ SLA.' },
  { title: 'استقرار متعدد المنصات', description: 'العمليات المتزامنة عبر المنصات المتنافسة تقلل مخاطر الاعتماد وتحسن الاستقرار على مستوى المدينة.' },
  { title: 'قدرة جاهزة للذروة', description: 'مصممة لامتصاص ذروات الطلب دون تدهور في SLA.' },
  { title: 'عمليات بمستوى الحوكمة', description: 'تقارير وضوابط وانضباط مناسب للشراكات المؤسسية.' },
];

const siteConfig = [
  { key: 'domain', value: 'fll.sa' },
  { key: 'domain_www', value: 'www.fll.sa' },
  { key: 'company_name', value: 'فيرست لاين لوجستيكس' },
  { key: 'company_name_en', value: 'First Line Logistics' },
  { key: 'email', value: 'info@firstlinelog.com' },
  { key: 'phone', value: '0126033133' },
  { key: 'city', value: 'جدة' },
  { key: 'country', value: 'المملكة العربية السعودية' },
];

async function seed() {
  console.log('🚀 بدء إدخال البيانات...\n');

  // metrics
  const { error: e1 } = await supabase.from('metrics').upsert(metrics, { onConflict: 'id', ignoreDuplicates: true });
  console.log(e1 ? `❌ metrics: ${e1.message}` : '✅ metrics: تم إدخال البيانات');

  // platforms
  const { error: e2 } = await supabase.from('platforms').upsert(platforms, { onConflict: 'id' });
  console.log(e2 ? `❌ platforms: ${e2.message}` : '✅ platforms: تم إدخال البيانات');

  // cities
  const { error: e3 } = await supabase.from('cities').upsert(cities, { onConflict: 'id', ignoreDuplicates: true });
  console.log(e3 ? `❌ cities: ${e3.message}` : '✅ cities: تم إدخال البيانات');

  // services
  const { error: e4 } = await supabase.from('services').upsert(services, { onConflict: 'id', ignoreDuplicates: true });
  console.log(e4 ? `❌ services: ${e4.message}` : '✅ services: تم إدخال البيانات');

  // benefits
  const { error: e5 } = await supabase.from('benefits').upsert(benefits, { onConflict: 'id', ignoreDuplicates: true });
  console.log(e5 ? `❌ benefits: ${e5.message}` : '✅ benefits: تم إدخال البيانات');

  // site_config
  const { error: e6 } = await supabase.from('site_config').upsert(siteConfig, { onConflict: 'key' });
  console.log(e6 ? `❌ site_config: ${e6.message}` : '✅ site_config: تم إدخال البيانات');

  console.log('\n✅ انتهى إدخال البيانات!');
}

seed().catch(console.error);
