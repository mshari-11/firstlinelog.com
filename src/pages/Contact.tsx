import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, Globe, ShieldCheck, Loader2 } from "lucide-react";
import { IMAGES } from "@/assets/images";
import { InquiryType } from "@/lib/index.ts";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
const contactFormSchema = z.object({
  name: z.string().min(2, {
    message: "يجب أن يكون الاسم حرفين على الأقل."
  }),
  company: z.string().min(2, {
    message: "اسم الشركة مطلوب."
  }),
  inquiryType: z.enum(["Platform", "Investor", "Fleet", "General"] as const),
  city: z.string().min(2, {
    message: "يرجى تحديد المدينة."
  }),
  message: z.string().min(10, {
    message: "يجب أن تكون الرسالة 10 أحرف على الأقل."
  })
});
const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      company: "",
      inquiryType: "General",
      city: "",
      message: ""
    }
  });
  async function onSubmit(values: z.infer<typeof contactFormSchema>) {
    setIsSubmitting(true);
    try {
      if (supabase) {
        const { error } = await supabase
          .from("contact_submissions")
          .insert({
            name: values.name,
            company: values.company,
            inquiry_type: values.inquiryType,
            city: values.city,
            message: values.message,
          });
        if (error) throw error;
      }
      toast.success("تم إرسال طلبك بنجاح. سيتواصل معك فريقنا قريباً.");
      form.reset();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return <div className="flex flex-col min-h-screen bg-background page-with-logo-bg" dir="rtl">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={IMAGES.CORPORATE_MEETING_4} alt="Contact Hero" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} className="max-w-3xl text-right">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              لنبني التنفيذ <span className="text-primary">معاً</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              هل تبحث عن شريك تنفيذ موثوق؟ نحن هنا لمناقشة فرص الشراكة وبناء حلول تشغيلية مخصصة لاحتياجاتك.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Contact Form */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <motion.div initial={{
              opacity: 0,
              x: 20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.5
            }}>
                <Card className="border-border shadow-lg bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-right">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField control={form.control} name="name" render={({
                          field
                        }) => <FormItem>
                                <FormLabel>الاسم الكامل</FormLabel>
                                <FormControl>
                                  <Input placeholder="أدخل اسمك" {...field} className="bg-background text-right" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>} />
                          <FormField control={form.control} name="company" render={({
                          field
                        }) => <FormItem>
                                <FormLabel>الشركة / الكيان</FormLabel>
                                <FormControl>
                                  <Input placeholder="اسم شركتك" {...field} className="bg-background text-right" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField control={form.control} name="inquiryType" render={({
                          field
                        }) => <FormItem>
                                <FormLabel>نوع الاستفسار</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-background text-right">
                                      <SelectValue placeholder="اختر النوع" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="text-right">
                                    <SelectItem value="Platform">شراكة منصات</SelectItem>
                                    <SelectItem value="Investor">علاقات المستثمرين</SelectItem>
                                    <SelectItem value="Fleet">شريك أسطول / سائق</SelectItem>
                                    <SelectItem value="General">استفسار عام</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>} />
                          <FormField control={form.control} name="city" render={({
                          field
                        }) => <FormItem>
                                <FormLabel>مدينة العمل</FormLabel>
                                <FormControl>
                                  <Input placeholder="مثال: الرياض، جدة" {...field} className="bg-background text-right" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>} />
                        </div>

                        <FormField control={form.control} name="message" render={({
                        field
                      }) => <FormItem>
                              <FormLabel>الرسالة</FormLabel>
                              <FormControl>
                                <Textarea placeholder="صف متطلبات الشراكة أو استفسارك..." className="min-h-[150px] bg-background text-right" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />

                        <Button type="submit" className="w-full py-6 text-lg font-semibold group" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1 rotate-180" />
                          )}
                          {isSubmitting ? "جاري الإرسال..." : "إرسال الاستفسار"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-5 space-y-10 order-1 lg:order-2">
              <motion.div initial={{
              opacity: 0,
              x: -20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.5,
              delay: 0.2
            }}>
                <div className="space-y-8 text-right">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">التواصل المؤسسي</h3>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-xl">
                          <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">المقر الرئيسي</p>
                          <p className="text-muted-foreground">جدة، المملكة العربية السعودية</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-xl">
                          <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">البريد الرسمي</p>
                          <p className="text-muted-foreground">info@firstlinelog.com</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-xl">
                          <Phone className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">رقم الهاتف</p>
                          <p className="text-muted-foreground">0126033133</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-xl">
                          <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">الامتثال والحوكمة</p>
                          <p className="text-muted-foreground">info@firstlinelog.com</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-muted/50 border border-border">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      البصمة الإقليمية
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      نعمل في أكثر من 16 مدينة في المملكة العربية السعودية مع قدرات توسعية في الإمارات وقطر والبحرين والكويت.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold">التحقق من البيانات</h3>
                    <p className="text-xs text-muted-foreground italic">
                      الأرقام المعروضة في هذه المنصة هي تقديرات تشغيلية مستمدة من بيانات داخلية مدعومة من المنصات ومعايير السوق المتاحة للجمهور. لا تشكل شهادات حكومية رسمية. تخضع جميع طلبات الشراكة للمراجعة الداخلية للامتثال والمخاطر.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="h-[400px] w-full bg-muted relative overflow-hidden">
        <div className="absolute inset-0 grayscale opacity-50 bg-[url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/90 backdrop-blur p-6 rounded-2xl border border-border shadow-2xl max-w-xs text-center">
            <p className="font-bold text-primary mb-1">First Line Logistics</p>
            
          </div>
        </div>
      </section>
    </div>;
};
export default Contact;