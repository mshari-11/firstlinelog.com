# Claude AI Configuration
# تكوين الذكاء الاصطناعي كلود

## Overview
This document explains how to integrate Claude 3 Opus AI into the First Line Logistics system.

## API Configuration

### Claude 3 Opus Details

**API Key:**
```
# Get your API key from: https://console.anthropic.com/
# Add it to your .env file as CLAUDE_API_KEY
```

**Model:** `claude-3-opus-20240229`

**Base URL:** `https://api.anthropic.com`

**Max Tokens:** 4096

### Environment Variables

Add the following to your `.env` file:

```env
# Claude AI Configuration
# Get your API key from: https://console.anthropic.com/
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-opus-20240229
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7
CLAUDE_API_VERSION=2023-06-01
```

## Integration Use Cases

### 1. Automatic Code Generation (Prisma ORM)
Claude can generate Prisma schema and queries automatically:

```typescript
// Example: Generate Prisma schema from requirements
const generatePrismaSchema = async (requirements: string) => {
  const response = await claude.messages.create({
    model: process.env.CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Generate a Prisma schema for: ${requirements}`
    }]
  });
  return response.content;
};
```

### 2. Customer Support Chatbot
Handle courier inquiries 24/7:

```typescript
// Example: Answer courier questions
const handleCourierQuery = async (question: string, context: object) => {
  const response = await claude.messages.create({
    model: process.env.CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `Context: ${JSON.stringify(context)}\n\nQuestion: ${question}\n\nProvide a helpful answer in Arabic.`
    }]
  });
  return response.content;
};
```

### 3. Data Analysis & Reports
Analyze courier data and generate insights:

```typescript
// Example: Generate monthly report
const generateMonthlyReport = async (data: object) => {
  const response = await claude.messages.create({
    model: process.env.CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Analyze this courier data and provide insights in Arabic: ${JSON.stringify(data)}`
    }]
  });
  return response.content;
};
```

### 4. Excel Data Processing
Clean and process daily Excel uploads:

```typescript
// Example: Clean Excel data
const cleanExcelData = async (rawData: string) => {
  const response = await claude.messages.create({
    model: process.env.CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Clean this Excel data and standardize courier names and amounts: ${rawData}`
    }]
  });
  return response.content;
};
```

### 5. Contract & Policy Explanation
Explain complex contracts in simple Arabic:

```typescript
// Example: Explain contract terms
const explainContract = async (contractText: string) => {
  const response = await claude.messages.create({
    model: process.env.CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `Explain these contract terms in simple Arabic: ${contractText}`
    }]
  });
  return response.content;
};
```

## Sample Implementation

### Basic Claude Client Setup

```typescript
// src/lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export class ClaudeAI {
  async chat(message: string, systemPrompt?: string) {
    try {
      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
        max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7'),
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: message
        }]
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Claude AI Error:', error);
      throw error;
    }
  }

  async generateCode(prompt: string) {
    const systemPrompt = `You are an expert programmer. Generate clean, production-ready code.`;
    return this.chat(prompt, systemPrompt);
  }

  async answerInArabic(question: string, context?: object) {
    const systemPrompt = `أنت مساعد ذكي لشركة فيرست لاين لوجستيكس. أجب باللغة العربية بشكل واضح ومفيد.`;
    const fullPrompt = context 
      ? `السياق: ${JSON.stringify(context, null, 2)}\n\nالسؤال: ${question}`
      : question;
    
    return this.chat(fullPrompt, systemPrompt);
  }

  async analyzeData(data: object, analysisType: string) {
    const systemPrompt = `You are a data analyst. Provide insights in Arabic.`;
    const prompt = `نوع التحليل: ${analysisType}\n\nالبيانات:\n${JSON.stringify(data, null, 2)}\n\nقدم تحليل مفصل بالعربي.`;
    
    return this.chat(prompt, systemPrompt);
  }
}

export const claude = new ClaudeAI();
```

## API Usage Examples

### Example 1: Courier Salary Query

```typescript
import { claude } from '@/lib/claude';

// Courier asks about their salary
const courierQuery = async (courierId: string, question: string) => {
  // Fetch courier data
  const courierData = await db.courier.findUnique({
    where: { id: courierId },
    include: {
      orders: true,
      salary: true
    }
  });

  // Ask Claude
  const answer = await claude.answerInArabic(question, courierData);
  
  return answer;
};

// Usage
const answer = await courierQuery('courier-123', 'كم راتبي هذا الشهر؟');
console.log(answer);
// Output: "راتبك هذا الشهر هو 4,500 ريال سعودي. أكملت 150 طلب..."
```

### Example 2: Generate Prisma Schema

```typescript
import { claude } from '@/lib/claude';

const createPrismaSchema = async () => {
  const requirements = `
    نريد قاعدة بيانات لنظام إدارة المناديب تحتوي على:
    - جدول المناديب (اسم، رقم جوال، هوية، حالة)
    - جدول الطلبات (رقم، تاريخ، مبلغ، منصة)
    - جدول الرواتب (مندوب، مبلغ، تاريخ)
    - علاقات بين الجداول
  `;

  const schema = await claude.generateCode(
    `Generate a Prisma schema for: ${requirements}`
  );

  return schema;
};
```

### Example 3: Process Daily Excel

```typescript
import { claude } from '@/lib/claude';

const processExcelUpload = async (excelData: any[]) => {
  // Use Claude to clean and standardize data
  const prompt = `
    نظف هذه البيانات من ملف Excel:
    - وحد أسماء المناديب
    - تحقق من صحة الأرقام
    - أزل السطور الفارغة
    - قياسي التواريخ
    
    البيانات:
    ${JSON.stringify(excelData, null, 2)}
    
    أرجع JSON نظيف
  `;

  const cleanedData = await claude.chat(prompt);
  return JSON.parse(cleanedData);
};
```

## Rate Limits & Best Practices

### Rate Limits
- **Requests per minute:** 50
- **Tokens per minute:** 40,000
- **Tokens per day:** 300,000

### Best Practices

1. **Cache Responses:** Don't ask Claude the same question twice
   ```typescript
   const cache = new Map();
   const getCachedResponse = async (key: string, generator: () => Promise<string>) => {
     if (cache.has(key)) return cache.get(key);
     const response = await generator();
     cache.set(key, response);
     return response;
   };
   ```

2. **Error Handling:** Always handle API errors gracefully
   ```typescript
   try {
     const response = await claude.chat(message);
     return response;
   } catch (error) {
     if (error.status === 429) {
       // Rate limit - retry after delay
       await delay(5000);
       return claude.chat(message);
     }
     throw error;
   }
   ```

3. **Token Management:** Monitor token usage
   ```typescript
   const countTokens = (text: string): number => {
     // Approximate: 1 token ≈ 4 characters
     return Math.ceil(text.length / 4);
   };
   ```

4. **Context Window:** Keep messages under 200k tokens total

5. **System Prompts:** Use consistent system prompts for better results

## Security Considerations

1. **API Key Protection:**
   - ✅ Store in environment variables
   - ✅ Never commit to Git
   - ✅ Rotate keys regularly
   - ❌ Never expose in client-side code

2. **Data Privacy:**
   - ✅ Don't send personal IDs or sensitive data
   - ✅ Anonymize courier data when possible
   - ✅ Log all AI interactions for audit

3. **Input Validation:**
   - ✅ Validate user input before sending to Claude
   - ✅ Sanitize responses before displaying
   - ✅ Implement rate limiting per user

## Monitoring & Logging

```typescript
// Log all Claude interactions
const logClaudeInteraction = async (
  userId: string,
  prompt: string,
  response: string,
  tokens: number
) => {
  await db.aiLog.create({
    data: {
      userId,
      service: 'claude',
      prompt: prompt.substring(0, 1000), // truncate
      response: response.substring(0, 1000),
      tokens,
      timestamp: new Date()
    }
  });
};
```

## Cost Estimation

**Claude 3 Opus Pricing:**
- Input: $15 per 1M tokens
- Output: $75 per 1M tokens

**Example Monthly Cost:**
```
Assuming:
- 10,000 queries/month
- Average 500 input tokens per query
- Average 200 output tokens per response

Input cost:  10,000 × 500 / 1,000,000 × $15  = $75
Output cost: 10,000 × 200 / 1,000,000 × $75  = $150
                                    Total     = $225/month
```

**Optimization Tips:**
- Cache frequently asked questions
- Use shorter prompts when possible
- Batch similar requests
- Consider Claude 3 Sonnet for simple queries ($3/$15 per 1M tokens)

## Testing

```typescript
// Test Claude integration
describe('Claude AI', () => {
  it('should answer in Arabic', async () => {
    const answer = await claude.answerInArabic('مرحبا، كيف حالك؟');
    expect(answer).toContain('مرحبا');
  });

  it('should generate code', async () => {
    const code = await claude.generateCode('Create a TypeScript function to calculate salary');
    expect(code).toContain('function');
  });
});
```

## Support & Resources

- **Official Docs:** https://docs.anthropic.com
- **API Reference:** https://docs.anthropic.com/claude/reference
- **Status Page:** https://status.anthropic.com

---

**Last Updated:** February 2026  
**Version:** 1.0  
**Status:** Ready for Implementation ✅
