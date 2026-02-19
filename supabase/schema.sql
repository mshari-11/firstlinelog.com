-- =============================================================
-- جداول قاعدة بيانات فيرست لاين لوجستيكس (First Line Logistics)
-- يتم تنفيذ هذا الملف في Supabase SQL Editor لإنشاء الجداول
-- =============================================================

-- جدول المقاييس والإحصائيات
CREATE TABLE IF NOT EXISTS metrics (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  suffix TEXT,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول المنصات الشريكة
CREATE TABLE IF NOT EXISTS platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  logo TEXT,
  coming_soon BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول المدن التشغيلية
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول الخدمات
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "iconName" TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول المزايا التنافسية
CREATE TABLE IF NOT EXISTS benefits (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول إعدادات الموقع (domain, contact info, etc.)
CREATE TABLE IF NOT EXISTS site_config (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- إدخال البيانات الافتراضية
-- =============================================================

-- المقاييس
INSERT INTO metrics (label, value, suffix, description, icon) VALUES
  ('الطلبات السنوية', '6.4', 'مليون طلب+', 'حجم الطلبات المعالجة سنوياً عبر شبكتنا التشغيلية.', 'PackageCheck'),
  ('المدن التشغيلية', '18', 'مدينة', 'نطاق التغطية الجغرافية عبر المملكة العربية السعودية.', 'MapPin'),
  ('المنصات الشريكة', '7', 'منصات+', 'شراكات تشغيلية متعددة المنصات لضمان الاستقرار.', 'Layers'),
  ('الطلبات اليومية في الذروة', '35,000', 'طلب', 'القدرة التشغيلية القصوى خلال أوقات الذروة والمواسم.', 'Zap')
ON CONFLICT DO NOTHING;

-- المنصات
INSERT INTO platforms (id, name, category, logo, coming_soon) VALUES
  ('p1', 'هنقرستيشن', 'توصيل طعام', 'https://firstlinelog.skywork.website/images/%D8%AE%D8%AF%D9%85%D8%A9-%D8%A7%D9%84%D8%B9%D9%85%D9%84%D8%A7%D8%A1-%D9%87%D9%86%D9%82%D8%B1%D8%B3%D8%AA%D9%8A%D8%B4%D9%86.jpg', false),
  ('p2', 'جاهز', 'توصيل طعام', 'https://firstlinelog.skywork.website/images/images_5326.png', false),
  ('p3', 'مرسول', 'توصيل كل شيء', 'https://firstlinelog.skywork.website/images/%D8%B4%D8%B1%D9%83%D8%A7%D8%AA-%D8%AA%D9%88%D8%B5%D9%8A%D9%84-%D8%B7%D9%84%D8%A8%D8%A7%D8%AA-%D8%A7%D9%84%D9%85%D8%B7%D8%A7%D8%B9%D9%85-%D9%81%D9%8A-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9-1722690188-0.webp', false),
  ('p4', 'ذا شيفز', 'توصيل طعام', 'https://firstlinelog.skywork.website/images/%D8%A3%D8%B4%D9%87%D8%B1-10-%D8%AA%D8%B7%D8%A8%D9%8A%D9%82%D8%A7%D8%AA-%D8%AA%D9%88%D8%B5%D9%8A%D9%84-%D8%A7%D9%84%D8%B7%D8%B9%D8%A7%D9%85-%D9%81%D9%8A-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9-2025-%D8%AA%D8%B7%D8%A8%D9%8A%D9%82-The-chefz.jpg', false),
  ('p5', 'نينجا', 'توصيل سريع', 'https://firstlinelog.skywork.website/images/Gux53J6XkAAKnf4.png', false),
  ('p6', 'تويو', 'خدمات لوجستية', 'https://firstlinelog.skywork.website/images/images%20(1).png', false),
  ('p7', 'كيتا', 'توصيل طعام', 'https://firstlinelog.skywork.website/images/images.jpg', false),
  ('p8', 'أمازون', 'تجارة إلكترونية', 'https://firstlinelog.skywork.website/images/517hY12cdLL.jpg', true)
ON CONFLICT DO NOTHING;

-- المدن
INSERT INTO cities (name, region) VALUES
  ('الرياض', 'الوسطى'),
  ('جدة', 'الغربية'),
  ('مكة المكرمة', 'الغربية'),
  ('المدينة المنورة', 'الغربية'),
  ('الدمام', 'الشرقية'),
  ('الخبر', 'الشرقية'),
  ('القصيم', 'الوسطى'),
  ('أبها', 'الجنوبية'),
  ('تبوك', 'الشمالية'),
  ('حائل', 'الشمالية'),
  ('جيزان', 'الجنوبية'),
  ('نجران', 'الجنوبية'),
  ('الجبيل', 'الشرقية'),
  ('الهفوف', 'الشرقية'),
  ('الخرج', 'الوسطى'),
  ('ينبع', 'الغربية')
ON CONFLICT DO NOTHING;

-- الخدمات
INSERT INTO services (title, description, "iconName") VALUES
  ('توصيل الميل الأخير (3PL)', 'حلول تنفيذ شاملة لمنصات التوصيل تضمن السرعة والدقة والاحترافية في الوصول للمستهلك.', 'Truck'),
  ('إدارة الأساطيل والسائقين', 'إدارة متكاملة لآلاف السائقين وأساطيل المركبات لضمان استمرارية التشغيل على مدار الساعة.', 'Users'),
  ('الجودة والامتثال (SLA)', 'الالتزام الصارم باتفاقيات مستوى الخدمة والمعايير التنظيمية لضمان تجربة مستخدم مثالية.', 'ShieldCheck'),
  ('إدارة الذروة والمواسم', 'مرونة تشغيلية عالية وقدرة على التوسع السريع لتغطية الطلب المرتفع خلال المواسم والأعياد.', 'Zap'),
  ('دعم التوسع الجغرافي', 'تسهيل دخول المنصات لمدن جديدة عبر بنية تحتية تشغيلية جاهزة وفريق عمل خبير.', 'Globe')
ON CONFLICT DO NOTHING;

-- المزايا
INSERT INTO benefits (title, description) VALUES
  ('التحكم في التنفيذ', 'نحن لا نوسط الطلب - نحن ننفذه. السائقون والأساطيل والمناطق وإدارة الذروة وإنفاذ SLA.'),
  ('استقرار متعدد المنصات', 'العمليات المتزامنة عبر المنصات المتنافسة تقلل مخاطر الاعتماد وتحسن الاستقرار على مستوى المدينة.'),
  ('قدرة جاهزة للذروة', 'مصممة لامتصاص ذروات الطلب دون تدهور في SLA.'),
  ('عمليات بمستوى الحوكمة', 'تقارير وضوابط وانضباط مناسب للشراكات المؤسسية.')
ON CONFLICT DO NOTHING;

-- إعدادات الموقع
INSERT INTO site_config (key, value) VALUES
  ('domain', 'fll.sa'),
  ('domain_www', 'www.fll.sa'),
  ('company_name', 'فيرست لاين لوجستيكس'),
  ('company_name_en', 'First Line Logistics'),
  ('email', 'info@firstlinelog.com'),
  ('phone', '0126033133'),
  ('city', 'جدة'),
  ('country', 'المملكة العربية السعودية')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- =============================================================
-- تفعيل Row Level Security (RLS) للقراءة العامة
-- =============================================================

ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة العامة (anon key)
CREATE POLICY "Allow public read" ON metrics FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON platforms FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cities FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON services FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON benefits FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON site_config FOR SELECT USING (true);
