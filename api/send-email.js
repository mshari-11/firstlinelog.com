import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
const ses = new SESClient({
    region: 'eu-west-2',
    credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const templates = {
    otp: (data) => ({
          subject: 'رمز التحقق - فيرست لاين لوجستيكس',
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:12px"><div style="text-align:center;margin-bottom:20px"><h1 style="color:#1e40af">فيرست لاين لوجستيكس</h1></div><div style="background:#fff;padding:30px;border-radius:8px;text-align:center"><h2 style="color:#1e293b">رمز التحقق الخاص بك</h2><p style="font-size:40px;font-weight:bold;color:#2563eb;letter-spacing:8px;margin:20px 0">${data.code}</p><p style="color:#64748b">صالح لمدة 5 دقائق فقط</p></div></div>`,
    }),
    welcome: (data) => ({
          subject: 'مرحباً بك في فيرست لاين لوجستيكس',
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:12px"><div style="text-align:center;margin-bottom:20px"><h1 style="color:#1e40af">فيرست لاين لوجستيكس</h1></div><div style="background:#fff;padding:30px;border-radius:8px"><h2 style="color:#1e293b">مرحباً ${data.name}</h2><p style="color:#475569">تم تسجيلك بنجاح كـ <strong>${data.role || 'مستخدم'}</strong></p><div style="text-align:center;margin:20px 0"><a href="https://fll.sa/unified-login" style="background:#2563eb;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold">تسجيل الدخول</a></div></div></div>`,
    }),
    resetPassword: (data) => ({
          subject: 'إعادة تعيين كلمة المرور - فيرست لاين لوجستيكس',
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:12px"><div style="text-align:center;margin-bottom:20px"><h1 style="color:#1e40af">فيرست لاين لوجستيكس</h1></div><div style="background:#fff;padding:30px;border-radius:8px;text-align:center"><h2 style="color:#1e293b">إعادة تعيين كلمة المرور</h2><p style="color:#475569">تم طلب إعادة تعيين كلمة المرور لحسابك</p><div style="margin:20px 0"><a href="${data.link}" style="background:#2563eb;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold">إعادة تعيين كلمة المرور</a></div><p style="color:#94a3b8;font-size:12px">الرابط صالح لمدة ساعة واحدة</p></div></div>`,
    }),
    notification: (data) => ({
          subject: data.subject || 'إشعار من فيرست لاين لوجستيكس',
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:12px"><div style="text-align:center;margin-bottom:20px"><h1 style="color:#1e40af">فيرست لاين لوجستيكس</h1></div><div style="background:#fff;padding:30px;border-radius:8px"><h2 style="color:#1e293b">${data.title}</h2><p style="color:#475569">${data.message}</p></div></div>`,
    }),
    support: (data) => ({
          subject: `رد على استفسارك #${data.ticketId || ''}`,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:12px"><div style="text-align:center;margin-bottom:20px"><h1 style="color:#1e40af">فيرست لاين لوجستيكس - الدعم الفني</h1></div><div style="background:#fff;padding:30px;border-radius:8px"><h2 style="color:#1e293b">رد فريق الدعم</h2><p style="color:#475569">${data.message}</p><hr style="border:1px solid #e2e8f0;margin:20px 0"/><p style="color:#94a3b8;font-size:12px">للرد تواصل معنا على support@fll.sa</p></div></div>`,
    }),
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
          const { type, to, data } = req.body;
          if (!type || !to) return res.status(400).json({ error: 'type and to are required' });
          const templateFn = templates[type];
          if (!templateFn) return res.status(400).json({ error: 'Invalid type' });
          const template = templateFn(data || {});
          const fromEmail = type === 'support' ? 'support@fll.sa' : 'no-reply@fll.sa';
          const command = new SendEmailCommand({
                  Source: fromEmail,
                  Destination: { ToAddresses: [to] },
                  Message: {
                            Subject: { Data: template.subject, Charset: 'UTF-8' },
                            Body: { Html: { Data: template.html, Charset: 'UTF-8' } },
                  },
          });
          await ses.send(command);
          res.status(200).json({ success: true, message: 'Email sent to ' + to });
    } catch (error) {
          console.error('SES Error:', error);
          res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
}
