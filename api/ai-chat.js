/**
 * AI Chat API - Vercel Serverless Function
 * يستخدم Vercel AI Gateway مع نموذج GPT-5
 * متاح فقط لصفحات الإدارة (مالية، موارد بشرية، تشغيل، إدارة)
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
    }

  const { messages, userRole } = req.body;

  // التحقق من الصلاحيات - مسموح فقط للأدوار الإدارية
  const allowedRoles = ['admin', 'owner', 'staff', 'finance', 'hr', 'operations'];
    if (!userRole || !allowedRoles.includes(userRole)) {
          return res.status(403).json({ error: 'غير مصرح لك باستخدام المساعد الذكي' });
    }

  if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid messages format' });
  }

  const apiKey = process.env.VERCEL_AI_GATEWAY_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
  }

  try {
        const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
                method: 'POST',
                headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                          model: 'openai/gpt-5',
                          messages: [
                            {
                                          role: 'system',
                                          content: `أنت مساعد فيرست لاين الذكي، مساعد ذكي متخصص لشركة فيرست لاين للخدمات اللوجستية.
                                          مهمتك مساعدة فريق الإدارة في:
                                          - تحليل البيانات والإحصائيات
                                          - الإجابة على استفسارات العمليات اللوجستية
                                          - دعم قرارات الموارد البشرية والمالية
                                          - تحليل أداء المندوبين والطلبات
                                          - الإجابة على الأسئلة الإدارية والتشغيلية

                                          تحدث دائماً باللغة العربية ما لم يطلب المستخدم غير ذلك.
                                          أنت متاح فقط لفريق الإدارة والموظفين المصرح لهم.`,
                            },
                                      ...messages,
                                    ],
                          stream: false,
                          max_tokens: 1000,
                          temperature: 0.7,
                }),
        });

      if (!response.ok) {
              const error = await response.text();
              console.error('AI Gateway error:', error);
              return res.status(response.status).json({ error: 'فشل في الاتصال بالمساعد الذكي' });
      }

      const data = await response.json();
        const assistantMessage = data.choices?.[0]?.message?.content;

      if (!assistantMessage) {
              return res.status(500).json({ error: 'لم يتم استلام رد من المساعد' });
      }

      return res.status(200).json({
              message: assistantMessage,
              usage: data.usage,
      });
  } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({ error: 'حدث خطأ في المساعد الذكي' });
  }
}
