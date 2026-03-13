import { Link } from "react-router-dom";

const services = [
  {
    icon: "🚛",
    title: "إدارة الأسطول",
    description:
      "إدارة شاملة لأسطول المركبات تشمل التتبع المباشر، جدولة الصيانة، تحسين المسارات، ومراقبة أداء السائقين لضمان أعلى كفاءة تشغيلية.",
    variant: "",
  },
  {
    icon: "📦",
    title: "عمليات الميل الأخير",
    description:
      "حلول توصيل متقدمة للميل الأخير مع تتبع فوري، إشعارات ذكية، وتحسين مستمر لمعدلات التسليم الناجح في جميع أنحاء المملكة.",
    variant: "gold",
  },
  {
    icon: "💰",
    title: "الإدارة المالية",
    description:
      "نظام مالي متكامل يشمل المحافظ الرقمية، دفعات السائقين، التسويات المالية، وتقارير الربحية مع شفافية كاملة ودقة محاسبية.",
    variant: "green",
  },
  {
    icon: "⚙️",
    title: "المنصة التقنية",
    description:
      "منصة تقنية سحابية متطورة مبنية على AWS توفر تكاملاً سلساً مع منصات التوصيل، أتمتة العمليات، وقابلية توسع غير محدودة.",
    variant: "",
  },
  {
    icon: "👥",
    title: "الموارد البشرية والامتثال",
    description:
      "إدارة كاملة لدورة حياة السائق من التوظيف والتأهيل إلى العقود والامتثال التنظيمي وفقاً لأنظمة المملكة العربية السعودية.",
    variant: "gold",
  },
  {
    icon: "📊",
    title: "التحليلات والتقارير",
    description:
      "لوحات معلومات تفاعلية وتقارير تحليلية متقدمة توفر رؤى عميقة حول الأداء التشغيلي والمالي لاتخاذ قرارات مبنية على البيانات.",
    variant: "green",
  },
];

const steps = [
  {
    number: "٠١",
    title: "التأهيل والإعداد",
    description:
      "نبدأ بفهم احتياجاتك التشغيلية، إعداد الأسطول، تسجيل السائقين، وربط منصات التوصيل خلال أيام معدودة.",
  },
  {
    number: "٠٢",
    title: "التشغيل والإدارة",
    description:
      "ندير عملياتك اليومية بكفاءة عالية مع مراقبة مستمرة للأداء، تحسين المسارات، ومعالجة المدفوعات تلقائياً.",
  },
  {
    number: "٠٣",
    title: "التقارير والتحسين",
    description:
      "نقدم تقارير دورية شاملة مع توصيات تحسين مبنية على البيانات لزيادة الربحية وتقليل التكاليف التشغيلية.",
  },
];

export default function Services() {
  return (
    <main>
      {/* Hero */}
      <section className="fll-page-hero">
        <div className="fll-page-hero-content">
          <span className="fll-page-eyebrow fll-animate-in">خدماتنا</span>
          <h1 className="fll-page-title fll-animate-in-1">
            حلول لوجستية شاملة لتشغيل أسطولك بأعلى كفاءة
          </h1>
          <p className="fll-page-subtitle fll-animate-in-2">
            نقدم مجموعة متكاملة من الخدمات اللوجستية المصممة خصيصاً لسوق
            المملكة العربية السعودية، من إدارة الأسطول إلى التحليلات المتقدمة.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">ما نقدمه لك</h2>
            <p className="fll-section-desc">
              ستة محاور أساسية تغطي جميع جوانب عملياتك اللوجستية
            </p>
          </div>
          <div className="fll-grid-3">
            {services.map((service, index) => (
              <div
                key={service.title}
                className={`fll-feature-card fll-animate-in-${index + 1}`}
              >
                <div
                  className={`fll-feature-icon${service.variant ? ` ${service.variant}` : ""}`}
                >
                  {service.icon}
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="fll-section fll-section-alt">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">كيف نعمل</h2>
            <p className="fll-section-desc">
              ثلاث خطوات بسيطة للانطلاق نحو تشغيل لوجستي متميز
            </p>
          </div>
          <div className="fll-grid-3">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`fll-feature-card fll-animate-in-${index + 1}`}
              >
                <div className="fll-feature-icon gold">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fll-cta-section">
        <div className="fll-section-inner">
          <h2 className="fll-section-title fll-animate-in">
            جاهز لتطوير عملياتك اللوجستية؟
          </h2>
          <p className="fll-section-desc fll-animate-in-1">
            تواصل معنا اليوم واكتشف كيف يمكن لخدماتنا تحسين كفاءة أسطولك
            وزيادة أرباحك.
          </p>
          <div className="fll-animate-in-2">
            <Link to="/contact" className="fll-cta-btn">
              تواصل معنا
            </Link>
            <Link to="/about" className="fll-cta-btn-outline">
              تعرف علينا أكثر
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
