/**
 * قالب صفحة الخدمة الفرعية - يُستخدم لكل صفحات الخدمات
 */
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, LogIn, UserPlus, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const spring = { stiffness: 200, damping: 40 };

export interface ServiceFeature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface ServiceStat {
  label: string;
  value: string;
}

export interface RelatedLink {
  label: string;
  path: string;
  icon: LucideIcon;
  color?: string;
}

interface ServicePageLayoutProps {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  features: ServiceFeature[];
  stats?: ServiceStat[];
  adminPath?: string;
  relatedLinks: RelatedLink[];
  heroImage?: string;
  accentColor?: string;
}

export default function ServicePageLayout({
  title,
  subtitle,
  description,
  icon: Icon,
  features,
  stats,
  adminPath,
  relatedLinks,
  heroImage,
  accentColor = "oklch(0.65 0.18 200)",
}: ServicePageLayoutProps) {
  return (
    <div className="flex flex-col w-full overflow-hidden" dir="rtl">
      {/* Hero */}
      <section
        className="relative pt-32 pb-20 md:pt-44 md:pb-28"
        style={{ background: "oklch(0.08 0.06 220)" }}
      >
        {heroImage && (
          <div className="absolute inset-0 z-0">
            <img src={heroImage} alt={title} className="w-full h-full object-cover opacity-15" />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, oklch(0.08 0.06 220 / 0.7), oklch(0.08 0.06 220))",
              }}
            />
          </div>
        )}

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            transition={spring}
            className="max-w-4xl"
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: `color-mix(in oklch, ${accentColor} 15%, transparent)` }}
            >
              <Icon className="w-5 h-5" style={{ color: accentColor }} />
              <span className="text-sm font-medium" style={{ color: accentColor }}>
                {subtitle}
              </span>
            </div>

            <h1
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
              style={{ color: "oklch(0.95 0.01 220)" }}
            >
              {title}
            </h1>
            <p
              className="text-xl md:text-2xl leading-relaxed max-w-3xl"
              style={{ color: "oklch(0.65 0.03 220)" }}
            >
              {description}
            </p>

            {/* أزرار الدخول */}
            <div className="flex flex-wrap gap-4 mt-10">
              {adminPath && (
                <Button asChild size="lg" className="gap-2 px-8" style={{ background: accentColor }}>
                  <Link to={adminPath}>
                    <LogIn className="w-5 h-5" />
                    دخول لوحة الإدارة
                  </Link>
                </Button>
              )}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 px-8 border-white/20 text-white hover:bg-white/10"
              >
                <Link to="/courier/register">
                  <UserPlus className="w-5 h-5" />
                  تسجيل كمندوب
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* الإحصائيات */}
      {stats && stats.length > 0 && (
        <section
          className="py-6 border-b"
          style={{
            background: "oklch(0.12 0.06 220)",
            borderColor: "oklch(0.20 0.05 210 / 0.5)",
          }}
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center py-4"
                >
                  <p className="text-2xl md:text-3xl font-bold" style={{ color: accentColor }}>
                    {stat.value}
                  </p>
                  <p className="text-sm mt-1" style={{ color: "oklch(0.55 0.04 210)" }}>
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* المميزات */}
      <section className="py-20" style={{ background: "oklch(0.10 0.06 220)" }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "oklch(0.92 0.02 220)" }}
            >
              مميزات الخدمة
            </h2>
            <p style={{ color: "oklch(0.55 0.04 210)" }} className="text-lg">
              أدوات وحلول متكاملة لإدارة وتحسين العمليات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ ...spring, delay: index * 0.08 }}
                className="p-6 rounded-2xl border transition-all hover:-translate-y-1"
                style={{
                  background: "oklch(0.14 0.06 220)",
                  borderColor: "oklch(0.22 0.05 210 / 0.5)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `color-mix(in oklch, ${accentColor} 15%, transparent)` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: "oklch(0.92 0.02 220)" }}
                >
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-sm" style={{ color: "oklch(0.55 0.04 210)" }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* الخدمات المرتبطة */}
      <section className="py-20" style={{ background: "oklch(0.08 0.06 220)" }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold mb-3"
              style={{ color: "oklch(0.92 0.02 220)" }}
            >
              خدمات مرتبطة
            </h2>
            <p style={{ color: "oklch(0.55 0.04 210)" }}>
              استكشف باقي أقسام المنظومة
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedLinks.map((link, i) => (
              <Link
                key={i}
                to={link.path}
                className="group p-5 rounded-xl border text-center transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{
                  background: "oklch(0.14 0.06 220)",
                  borderColor: "oklch(0.22 0.05 210 / 0.4)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors"
                  style={{
                    background: link.color
                      ? `color-mix(in oklch, ${link.color} 15%, transparent)`
                      : `color-mix(in oklch, ${accentColor} 12%, transparent)`,
                  }}
                >
                  <link.icon
                    className="w-6 h-6 transition-colors"
                    style={{ color: link.color || accentColor }}
                  />
                </div>
                <p
                  className="text-sm font-medium group-hover:opacity-100 transition-opacity"
                  style={{ color: "oklch(0.80 0.02 220)" }}
                >
                  {link.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* زر العودة */}
      <section
        className="py-8"
        style={{ background: "oklch(0.10 0.06 220)", borderTop: "1px solid oklch(0.20 0.05 210 / 0.3)" }}
      >
        <div className="container mx-auto px-4 flex justify-center">
          <Button
            asChild
            variant="ghost"
            className="gap-2 text-white/60 hover:text-white hover:bg-white/10"
          >
            <Link to="/">
              <ArrowRight className="w-4 h-4" />
              العودة للصفحة الرئيسية
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
