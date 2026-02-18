# إعداد النطاق والربط - Domain Configuration
# Connecting www.fll.sa with Cloudflare

## نظرة عامة

هذا الدليل يشرح كيفية ربط نطاق www.fll.sa مع التطبيق عبر Cloudflare.

---

## 📋 المعلومات الأساسية

```
النطاق الرئيسي: fll.sa
النطاق الفرعي: www.fll.sa
Skywork URL: https://firstlinelog.skywork.website/
Cloudflare Plan: Enterprise ($200/month)
```

---

## 🌐 خطوات الإعداد

### الخطوة 1: إعداد Cloudflare

#### 1.1 إضافة النطاق لـ Cloudflare

```bash
# Login to Cloudflare Dashboard
https://dash.cloudflare.com

# Add Site
1. Click "Add a Site"
2. Enter: fll.sa
3. Select Plan: Enterprise
4. Click "Add Site"
```

#### 1.2 تحديث Nameservers

قم بتحديث الـ nameservers عند مزود النطاق (مثل: SaudiNIC):

```
اسم السيرفر 1: alice.ns.cloudflare.com
اسم السيرفر 2: bob.ns.cloudflare.com
```

**ملاحظة:** قد يستغرق التحديث من 24-48 ساعة.

---

### الخطوة 2: إعداد DNS Records

أضف السجلات التالية في Cloudflare DNS:

#### A Records (IPv4)

```
Type: A
Name: @
Content: [IP address of your server]
Proxy status: Proxied (Orange Cloud)
TTL: Auto

Type: A
Name: www
Content: [IP address of your server]
Proxy status: Proxied (Orange Cloud)
TTL: Auto
```

#### CNAME Records

إذا كنت تستخدم Vercel أو Netlify:

```
Type: CNAME
Name: www
Content: cname.vercel-dns.com (أو firstlinelog.skywork.website)
Proxy status: Proxied (Orange Cloud)
TTL: Auto
```

#### TXT Records (للتحقق)

```
Type: TXT
Name: @
Content: v=spf1 include:_spf.google.com ~all
TTL: Auto
```

---

### الخطوة 3: إعداد SSL/TLS

#### 3.1 تفعيل SSL/TLS

```
في Cloudflare Dashboard:
SSL/TLS > Overview
└─ Encryption mode: Full (strict) ✅
```

#### 3.2 إنشاء Origin Certificate

```
SSL/TLS > Origin Server
└─ Create Certificate
   ├─ Private Key Type: RSA (2048)
   ├─ Hostnames: 
   │   ├─ fll.sa
   │   └─ *.fll.sa
   ├─ Certificate Validity: 15 years
   └─ Click "Create"
```

احفظ:
- Origin Certificate (public key)
- Private Key

#### 3.3 تثبيت Certificate على السيرفر

```bash
# For nginx
sudo nano /etc/nginx/ssl/fll.sa.crt
# Paste origin certificate

sudo nano /etc/nginx/ssl/fll.sa.key
# Paste private key

# Update nginx config
server {
    listen 443 ssl http2;
    server_name fll.sa www.fll.sa;
    
    ssl_certificate /etc/nginx/ssl/fll.sa.crt;
    ssl_certificate_key /etc/nginx/ssl/fll.sa.key;
    
    # ... rest of config
}

# Reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

#### 3.4 تفعيل HSTS

```
SSL/TLS > Edge Certificates
└─ Enable:
   ├─ Always Use HTTPS ✅
   ├─ HTTP Strict Transport Security (HSTS) ✅
   │   ├─ Max Age: 12 months
   │   ├─ Include subdomains ✅
   │   └─ Preload ✅
   └─ Minimum TLS Version: TLS 1.2 ✅
```

---

### الخطوة 4: إعداد Page Rules

#### 4.1 Force HTTPS

```
Create Page Rule:
URL: http://*fll.sa/*
Setting: Always Use HTTPS
```

#### 4.2 Redirect www to non-www (اختياري)

```
Create Page Rule:
URL: www.fll.sa/*
Setting: Forwarding URL (301)
Destination: https://fll.sa/$1
```

أو العكس (non-www to www):

```
Create Page Rule:
URL: fll.sa/*
Setting: Forwarding URL (301)
Destination: https://www.fll.sa/$1
```

#### 4.3 Cache Everything

```
Create Page Rule:
URL: *.fll.sa/static/*
Settings:
├─ Cache Level: Cache Everything
├─ Edge Cache TTL: 1 month
└─ Browser Cache TTL: 1 month
```

---

### الخطوة 5: تحسين الأداء (Performance)

#### 5.1 تفعيل Auto Minify

```
Speed > Optimization
└─ Auto Minify:
   ├─ JavaScript ✅
   ├─ CSS ✅
   └─ HTML ✅
```

#### 5.2 تفعيل Brotli Compression

```
Speed > Optimization
└─ Brotli ✅
```

#### 5.3 إعداد Cache Rules

```
Caching > Configuration
└─ Browser Cache TTL: 4 hours
└─ Crawler Hints: Enabled
```

---

### الخطوة 6: الأمان (Security)

#### 6.1 تفعيل Web Application Firewall (WAF)

```
Security > WAF
└─ Enable WAF ✅
   ├─ Managed Rules:
   │   ├─ Cloudflare Managed Ruleset ✅
   │   ├─ Cloudflare OWASP Core Ruleset ✅
   │   └─ Cloudflare Exposed Credentials Check ✅
   └─ Rate Limiting Rules:
       ├─ Login Protection
       ├─ API Rate Limiting
       └─ DDoS Protection
```

#### 6.2 تفعيل Bot Protection

```
Security > Bots
└─ Bot Fight Mode: Super Bot Fight Mode ✅
```

#### 6.3 إعداد Security Level

```
Security > Settings
└─ Security Level: Medium
└─ Challenge Passage: 30 minutes
```

---

### الخطوة 7: ربط مع Vercel/Netlify (إذا كان مطلوب)

#### 7.1 في Vercel Dashboard

```
1. Project Settings > Domains
2. Add Domain: www.fll.sa
3. Add Domain: fll.sa
4. Verify ownership with TXT record (if needed)
```

#### 7.2 تحديث Environment Variables

```env
VITE_APP_URL=https://www.fll.sa
VITE_APP_DOMAIN=fll.sa
VITE_SKYWORK_URL=https://firstlinelog.skywork.website/
```

---

### الخطوة 8: الاختبار (Testing)

#### 8.1 اختبار DNS

```bash
# Check DNS propagation
nslookup www.fll.sa
dig www.fll.sa

# Expected output:
# www.fll.sa. IN A [your-ip-address]
# or CNAME record to Vercel/Netlify
```

#### 8.2 اختبار SSL

```bash
# Check SSL certificate
openssl s_client -connect www.fll.sa:443 -servername www.fll.sa

# Check SSL labs
https://www.ssllabs.com/ssltest/analyze.html?d=www.fll.sa
# Expected: A+ rating
```

#### 8.3 اختبار الموقع

```bash
# Test HTTP to HTTPS redirect
curl -I http://www.fll.sa
# Expected: 301 or 302 redirect to https://

# Test HTTPS
curl -I https://www.fll.sa
# Expected: 200 OK

# Test response time
curl -w "@curl-format.txt" -o /dev/null -s https://www.fll.sa
```

#### 8.4 اختبار Cloudflare Features

```
1. Check if Cloudflare is working:
   curl -I https://www.fll.sa | grep -i "cf-ray"
   # Should show CF-Ray header

2. Check caching:
   curl -I https://www.fll.sa/static/logo.png | grep -i "cf-cache-status"
   # Should show HIT after second request

3. Check compression:
   curl -H "Accept-Encoding: br" -I https://www.fll.sa
   # Should show content-encoding: br
```

---

## 📊 مراقبة الأداء (Monitoring)

### Cloudflare Analytics

```
Analytics > Traffic
└─ Monitor:
   ├─ Requests
   ├─ Bandwidth
   ├─ Unique Visitors
   ├─ Threats Blocked
   └─ Cache Hit Ratio
```

### Alerts Setup

```
Notifications > Add
└─ Create alerts for:
   ├─ SSL expiration
   ├─ Traffic anomalies
   ├─ Origin errors
   ├─ DDoS attacks
   └─ Certificate validation errors
```

---

## 🔧 استكشاف الأخطاء (Troubleshooting)

### مشكلة: الموقع لا يعمل

```bash
# 1. Check DNS
nslookup www.fll.sa

# 2. Check if Cloudflare is working
curl -I https://www.fll.sa

# 3. Check origin server
curl -I http://[origin-ip]

# 4. Check Cloudflare errors
# Visit Cloudflare Dashboard > Analytics > Security
```

### مشكلة: SSL Certificate Error

```bash
# 1. Verify certificate
openssl s_client -connect www.fll.sa:443

# 2. Check Cloudflare SSL mode
# Should be: Full (strict)

# 3. Verify origin certificate is installed
```

### مشكلة: بطء في التحميل

```bash
# 1. Check cache status
curl -I https://www.fll.sa | grep -i cf-cache-status

# 2. Enable Argo Smart Routing (optional, extra cost)
# Speed > Argo

# 3. Check minification is enabled
# Speed > Optimization > Auto Minify

# 4. Check if images are optimized
# Speed > Optimization > Polish (Enterprise only)
```

---

## 🌍 توجيه حسب الموقع (Geographic Routing)

إذا كنت تريد توجيه المستخدمين لأقرب سيرفر:

```
Traffic > Load Balancing
└─ Create Load Balancer
   ├─ Name: fll-lb
   ├─ Hostname: www.fll.sa
   ├─ Origin Pools:
   │   ├─ Saudi Arabia (Primary)
   │   ├─ UAE (Backup)
   │   └─ Europe (Backup)
   └─ Geo Steering: Enabled ✅
```

---

## 💰 التكلفة الشهرية

```
Cloudflare Enterprise: $200/month
├─ Unlimited DDoS Protection
├─ Advanced WAF
├─ 100% Uptime SLA
├─ Custom SSL
├─ Priority Support 24/7
├─ Advanced Analytics
└─ Image Optimization

Optional Add-ons:
├─ Argo Smart Routing: $5/month + $0.10/GB
├─ Load Balancing: $5/origin/month
└─ Rate Limiting: $5/month per 10,000 requests
```

---

## 📞 الدعم الفني

### Cloudflare Support

```
Email: support@cloudflare.com
Phone: +1 (888) 993-5273 (Enterprise)
Portal: https://dash.cloudflare.com/support
Status: https://www.cloudflarestatus.com
```

### Community

```
Cloudflare Community: https://community.cloudflare.com
Documentation: https://developers.cloudflare.com
```

---

## ✅ Checklist النهائي

- [ ] إضافة النطاق لـ Cloudflare
- [ ] تحديث Nameservers
- [ ] إضافة DNS Records
- [ ] تفعيل SSL/TLS (Full Strict)
- [ ] تثبيت Origin Certificate
- [ ] تفعيل Always Use HTTPS
- [ ] تفعيل HSTS
- [ ] إضافة Page Rules
- [ ] تفعيل Auto Minify
- [ ] تفعيل Brotli
- [ ] تفعيل WAF
- [ ] تفعيل Bot Protection
- [ ] اختبار DNS
- [ ] اختبار SSL
- [ ] اختبار الموقع
- [ ] اختبار الأداء
- [ ] إعداد Monitoring & Alerts
- [ ] توثيق الإعدادات

---

## 📁 ملفات مرجعية

```
CNAME file: www.fll.sa (موجود في المشروع)
Environment: .env (يحتوي على إعدادات النطاق)
Documentation: docs/DOMAIN_SETUP.md (هذا الملف)
```

---

**تاريخ التحديث:** فبراير 2026  
**الإصدار:** 1.0  
**الحالة:** جاهز للتطبيق ✅  
**المسؤول:** فريق البنية التحتية - فيرست لاين لوجستيكس
