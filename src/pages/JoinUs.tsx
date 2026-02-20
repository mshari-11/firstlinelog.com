import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Truck, ShieldCheck, BarChart3, MapPin, ArrowLeft, ClipboardCheck, Headset } from 'lucide-react';
import { IMAGES } from '@/assets/images';
import { ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
const JoinUs = () => {
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };
  const benefits = [{
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "عمليات منظمة",
    description: "اعمل ضمن إطار عمل منضبط للغاية يعطي الأولوية للكفاءة والسلامة في كل خطوة."
  }, {
    icon: <Headset className="w-6 h-6" />,
    title: "دعم ميداني متواصل",
    description: "فرق دعم مخصصة على مدار الساعة طوال أيام الأسبوع لمساعدتك في التنقل خلال ساعات الذروة."
  }, {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "إدارة أداء شفافة",
    description: "مؤشرات أداء رئيسية واضحة وتقارير دورية لضمان النمو المستمر والتحكم في الجودة."
  }];
  const cities = ["الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "الظهران", "الطائف", "أبها", "خميس مشيط", "بريدة", "عنيزة", "حائل", "تبوك", "جازان", "نجران"];
  return <div className="flex flex-col min-h-screen bg-background" dir="rtl">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={IMAGES.SAUDI_CITIES_6} alt="لوجستيات المدن السعودية" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/20 to-background/90" />
        </div>

        <div className="container relative z-10 px-4 mx-auto text-center">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }}>
            <Badge variant="outline" className="mb-4 border-primary/50 text-primary bg-primary/5 px-4 py-1">
              فرص نمو على نطاق واسع
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              انضم إلى أقوى <br />
              <span className="text-primary">شبكة تشغيل لوجستية</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              نقدم عمليات منظمة، دعماً ميدانياً، وإدارة أداء احترافية لرسم مستقبل اقتصاد التوصيل في المملكة.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Registration Options */}
      <section className="py-24 container mx-auto px-4">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{
        once: true
      }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Driver Registration Card */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-border/50 hover:border-primary/50 transition-all group overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm">
              <CardHeader className="p-8">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <User className="text-primary w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">سجل كقائد مركبة</CardTitle>
                <CardDescription className="text-base mt-2">
                  انضم إلى أسطول النخبة من محترفي التوصيل. استفد من مسارات محسنة، دعم احترافي، ودورات دفع موثوقة.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    جدولة مرنة في أكثر من 16 مدينة
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    تدريب وتأهيل احترافي شامل
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    مكافآت أداء بناءً على معايير الجودة
                  </li>
                </ul>
                <Button className="w-full group/btn" size="lg" asChild>
                  <Link to="/courier/register">
                    قدم الآن
                    <ArrowLeft className="mr-2 w-4 h-4 transition-transform group-hover/btn:-translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Fleet Partner Registration Card */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-border/50 hover:border-primary/50 transition-all group overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm">
              <CardHeader className="p-8">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Truck className="text-primary w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">سجل كشريك أسطول</CardTitle>
                <CardDescription className="text-base mt-2">
                  قم بتوسيع نطاق أعمال أسطولك من خلال الشراكة مع فيرست لاين. احصل على طلبات مستقرة وأدوات إدارة مؤسسية.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    استقرار الطلب عبر منصات متعددة
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    أدوات مراقبة وتقارير متقدمة للأسطول
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    توسع مبسط في جميع مدن المملكة
                  </li>
                </ul>
                <Button variant="secondary" className="w-full group/btn" size="lg">
                  كن شريكاً لنا
                  <ArrowLeft className="mr-2 w-4 h-4 transition-transform group-hover/btn:-translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Why First Line Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{
            opacity: 0,
            x: 30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-8">
                مزايا العمل في <br />
                <span className="text-primary">بيئة تشغيلية منضبطة</span>
              </h2>
              <div className="space-y-8">
                {benefits.map((benefit, index) => <div key={index} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center text-primary shadow-sm">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>)}
              </div>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            scale: 0.95
          }} whileInView={{
            opacity: 1,
            scale: 1
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.8
          }} className="relative aspect-video lg:aspect-square rounded-2xl overflow-hidden shadow-2xl border border-border">
              
              
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-background/95 backdrop-blur-md rounded-xl border border-border shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ClipboardCheck className="text-primary w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary uppercase tracking-wider">
                        مبادئ الحوكمة
                      </p>
                      <p className="text-base font-semibold">
                        معايير مؤسسية عالية
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>الشفافية: الإفصاح عن المعلومات بدقة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>المساءلة: تحديد الصلاحيات والمسؤوليات</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>حماية حقوق المساهمين والعدالة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>إدارة المخاطر والمسؤولية الاجتماعية</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Network Reach Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              انضم إلينا في جميع أنحاء المملكة
            </h2>
            <p className="text-muted-foreground text-lg">
              نعمل في أكثر من 16 مدينة، مما يوفر وصولاً غير مسبوق لعمليات التوصيل.
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3">
            {cities.map(city => <Badge key={city} variant="secondary" className="py-2 px-6 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-all cursor-default border-border/50">
                <MapPin className="w-3 h-3 ml-2" />
                {city}
              </Badge>)}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto p-12 bg-primary rounded-[2rem] text-primary-foreground text-center relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 p-8 opacity-10">
              <Truck className="w-32 h-32 -rotate-12" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">
              هل أنت مستعد لرفع مستوى أداء التوصيل لديك؟
            </h2>
            <p className="text-xl mb-8 opacity-90 relative z-10 max-w-2xl mx-auto">
              ابدأ رحلتك مع فيرست لاين لوجستيكس اليوم وكن جزءاً من أكثر شبكات التوصيل انضباطاً في المملكة العربية السعودية.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Button asChild size="lg" variant="outline" className="bg-white text-primary border-white hover:bg-white/90 px-10">
                <Link to={ROUTE_PATHS.CONTACT}>
                  افتح صفحة للتسجيل
                </Link>
              </Button>
              <Button size="lg" variant="secondary" className="bg-transparent text-white border-white hover:bg-white/10 px-10">
                سجل كشريك أسطول
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>;
};
export default JoinUs;