import { Link, useParams } from "react-router-dom";

interface ServiceInfo {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
}

const services: Record<string, ServiceInfo> = {
  "food-delivery": {
    title: "توصيل الطعام",
    subtitle: "خدمات توصيل الطعام السريعة والموثوقة",
    description:
      "نوفر أسطولاً متخصصاً في توصيل الطعام بأعلى معايير الجودة والسرعة. نتعاون مع أبرز منصات التوصيل في المملكة لضمان وصول الطلبات طازجة وفي الوقت المحدد.",
    features: [
      "توصيل خلال ٣٠ دقيقة في المناطق الحضرية",
      "حقائب حرارية متخصصة للحفاظ على جودة الطعام",
      "تتبّع لحظي للطلب من المطعم حتى باب العميل",
      "سائقون مدرّبون على معايير سلامة الغذاء",
      "تغطية واسعة تشمل أكثر من ١٥ مدينة",
      "دعم فني على مدار الساعة",
    ],
  },
  "grocery-delivery": {
    title: "توصيل البقالة",
    subtitle: "توصيل المشتريات اليومية بسرعة وأمان",
    description:
      "خدمة متكاملة لتوصيل مشتريات البقالة والسوبرماركت. نضمن وصول المنتجات بحالة ممتازة مع الالتزام بسلسلة التبريد للمنتجات الحساسة.",
    features: [
      "مركبات مجهزة بأنظمة تبريد للمنتجات الطازجة",
      "تغليف آمن يحمي المنتجات أثناء النقل",
      "جدولة مواعيد التوصيل حسب رغبة العميل",
      "إمكانية التوصيل في نفس اليوم",
      "تعامل احترافي مع المنتجات القابلة للكسر",
      "فحص جودة المنتجات قبل التسليم",
    ],
  },
  "parcel-delivery": {
    title: "توصيل الطرود",
    subtitle: "حلول شحن وتوصيل الطرود داخل المدن",
    description:
      "خدمة توصيل الطرود والمستندات داخل المدن بسرعة عالية وأمان تام. مثالية للتجارة الإلكترونية والشركات والأفراد.",
    features: [
      "توصيل سريع خلال ساعات من الاستلام",
      "تأمين شامل على جميع الشحنات",
      "إثبات تسليم إلكتروني بالصور والتوقيع",
      "خيارات توصيل متعددة (عادي، سريع، فوري)",
      "إمكانية الدفع عند الاستلام",
      "خدمة الاسترجاع والتبديل",
    ],
  },
  "fleet-management": {
    title: "إدارة الأساطيل",
    subtitle: "حلول متكاملة لإدارة أساطيل التوصيل",
    description:
      "نقدم خدمات إدارة الأساطيل الشاملة للشركات والمنصات التي تحتاج إلى تشغيل أسطول توصيل خاص بها. نتولى إدارة السائقين والمركبات والعمليات اليومية.",
    features: [
      "توظيف وتدريب السائقين",
      "صيانة وتجهيز المركبات",
      "نظام إدارة عمليات متكامل",
      "تقارير أداء تفصيلية يومية وأسبوعية",
      "إدارة الجداول والورديات",
      "ضمان الالتزام بمعايير الجودة والسلامة",
    ],
  },
  "last-mile": {
    title: "الميل الأخير",
    subtitle: "حلول توصيل الميل الأخير المتخصصة",
    description:
      "خدمات الميل الأخير المصممة خصيصاً لتلبية احتياجات شركات التجارة الإلكترونية والشحن. نضمن وصول الطلبات للعملاء النهائيين بكفاءة وسرعة.",
    features: [
      "تكامل تقني مع أنظمة الشحن والتخزين",
      "تتبّع لحظي لجميع الشحنات",
      "محاولات تسليم متعددة",
      "إدارة المرتجعات بكفاءة",
      "تقارير تسليم تفصيلية",
      "خدمة عملاء مخصصة",
    ],
  },
};

const fallback: ServiceInfo = {
  title: "خدماتنا",
  subtitle: "حلول لوجستية متكاملة",
  description:
    "نقدم مجموعة شاملة من الخدمات اللوجستية المصممة لتلبية احتياجات السوق السعودي. تواصل معنا لمعرفة المزيد عن خدماتنا المتنوعة.",
  features: [
    "تغطية واسعة في جميع أنحاء المملكة",
    "تقنيات تتبّع متقدمة",
    "فريق دعم على مدار الساعة",
    "أسعار تنافسية",
    "جودة خدمة عالية",
    "مرونة في التشغيل",
  ],
};

export default function ServiceDetails() {
  const { slug } = useParams<{ slug: string }>();
  const service = (slug && services[slug]) || fallback;

  return (
    <main>
      <section className="fll-page-hero">
        <div className="fll-page-hero-content">
          <span className="fll-page-eyebrow fll-animate-in">خدماتنا</span>
          <h1 className="fll-page-title fll-animate-in-1">{service.title}</h1>
          <p className="fll-page-subtitle fll-animate-in-2">{service.subtitle}</p>
        </div>
      </section>

      <section className="fll-section">
        <div className="fll-section-inner" style={{ maxWidth: "850px", margin: "0 auto" }}>
          <div className="fll-feature-card fll-animate-in">
            <h3 style={{ color: "#38bdf8", marginBottom: "1rem" }}>نبذة عن الخدمة</h3>
            <p style={{ lineHeight: 2, color: "#cbd5e1" }}>{service.description}</p>
          </div>
        </div>
      </section>

      <section className="fll-section fll-section-alt">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">مميزات الخدمة</h2>
            <p className="fll-section-desc">ما يميّز خدمتنا عن غيرها</p>
          </div>
          <div className="fll-grid-2">
            {service.features.map((f, i) => (
              <div className={`fll-feature-card fll-animate-in-${(i % 6) + 1}`} key={i}>
                <p style={{ margin: 0, fontWeight: 600 }}>{f}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-cta-section">
        <div className="fll-section-inner" style={{ textAlign: "center" }}>
          <h2 className="fll-section-title">جاهز للبدء؟</h2>
          <p className="fll-section-desc">
            تواصل معنا اليوم لمعرفة كيف يمكننا مساعدتك في تحقيق أهدافك اللوجستية
          </p>
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/contact" className="fll-cta-btn">تواصل معنا</Link>
            <Link to="/services" className="fll-cta-btn-outline">جميع الخدمات</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
