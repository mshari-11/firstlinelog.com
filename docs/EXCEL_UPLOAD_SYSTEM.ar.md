# نظام رفع ملفات Excel اليومي
# Daily Excel Upload System

## نظرة عامة

نظام رفع ومعالجة ملفات Excel اليومية من منصات التوصيل (Jahez, HungerStation, Marsool, إلخ) لحساب رواتب ومستحقات المناديب.

---

## 🎯 الهدف

تحويل العملية اليدوية لمعالجة ملفات Excel إلى نظام آلي:
1. رفع الملف
2. تنظيف البيانات
3. تطبيق الحسابات
4. نظام اعتماد متعدد المستويات
5. إرسال النتائج للمناديب

---

## 📋 هيكل ملف Excel المطلوب

### الأعمدة الأساسية (Required Columns)

| العمود | Column Name | النوع | مثال | ملاحظات |
|--------|-------------|------|------|---------|
| اسم المندوب | courier_name | نص | أحمد محمد علي | الاسم الكامل |
| رقم الجوال | phone_number | نص | 966501234567 | مع كود الدولة |
| رقم الهوية | national_id | نص | 1234567890 | 10 أرقام |
| عدد الطلبات | orders_count | رقم | 150 | عدد صحيح |
| الإيرادات | total_revenue | رقم | 4500.50 | بالريال |
| المنصة | platform | نص | Jahez | اسم المنصة |
| نوع المركبة | vehicle_type | نص | سيارة | سيارة/دراجة/دباب |
| حالة المندوب | courier_status | نص | مركب | مركب/تطبيق |
| التاريخ | date | تاريخ | 2026-02-18 | YYYY-MM-DD |

### الأعمدة الاختيارية (Optional Columns)

| العمود | Column Name | النوع | الافتراضي |
|--------|-------------|------|-----------|
| المدينة | city | نص | - |
| الحي | district | نص | - |
| ساعات العمل | working_hours | رقم | - |
| نقاط الجودة | quality_score | رقم | 0 |
| الخصومات | deductions | رقم | 0 |
| المكافآت | bonuses | رقم | 0 |

---

## 🔄 سير العمل (Workflow)

### المرحلة 1: الرفع (Upload)

```typescript
// Frontend: Excel Upload Component
interface ExcelUploadProps {
  onUploadSuccess: (fileId: string) => void;
  onUploadError: (error: Error) => void;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onUploadSuccess, onUploadError }) => {
  const handleFileUpload = async (file: File) => {
    // Validate file
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      onUploadError(new Error('يرجى رفع ملف Excel (.xlsx أو .xls)'));
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onUploadError(new Error('حجم الملف يجب أن يكون أقل من 10 ميجا'));
      return;
    }

    // Upload to S3
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/excel/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    onUploadSuccess(data.fileId);
  };

  return (
    <div className="upload-area">
      <input 
        type="file" 
        accept=".xlsx,.xls"
        onChange={(e) => handleFileUpload(e.target.files[0])}
      />
    </div>
  );
};
```

### المرحلة 2: القراءة والتحليل (Parse)

```typescript
// Backend: Parse Excel file
import * as XLSX from 'xlsx';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

interface ExcelRow {
  courier_name: string;
  phone_number: string;
  national_id: string;
  orders_count: number;
  total_revenue: number;
  platform: string;
  vehicle_type: string;
  courier_status: string;
  date: string;
}

const parseExcelFile = async (fileKey: string): Promise<ExcelRow[]> => {
  // Download from S3
  const s3 = new S3Client({ region: process.env.AWS_S3_REGION });
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey
  });
  
  const response = await s3.send(command);
  const buffer = await streamToBuffer(response.Body);
  
  // Parse Excel
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);
  
  return rows;
};
```

### المرحلة 3: تنظيف البيانات (Data Cleaning)

```typescript
// Data cleaning with Claude AI
import { claude } from '@/lib/claude';

interface CleanedData {
  original: ExcelRow;
  cleaned: ExcelRow;
  issues: string[];
  confidence: number;
}

const cleanExcelData = async (rows: ExcelRow[]): Promise<CleanedData[]> => {
  const cleaned: CleanedData[] = [];
  
  for (const row of rows) {
    const issues: string[] = [];
    const cleanedRow = { ...row };
    
    // 1. Clean courier name
    if (row.courier_name) {
      cleanedRow.courier_name = row.courier_name
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[0-9]/g, ''); // Remove numbers
      
      if (cleanedRow.courier_name !== row.courier_name) {
        issues.push('تم تنظيف الاسم');
      }
    } else {
      issues.push('الاسم مفقود');
    }
    
    // 2. Validate phone number
    if (row.phone_number) {
      let phone = row.phone_number.toString().replace(/\D/g, '');
      
      // Add country code if missing
      if (!phone.startsWith('966')) {
        if (phone.startsWith('0')) {
          phone = '966' + phone.substring(1);
        } else if (phone.length === 9) {
          phone = '966' + phone;
        }
        issues.push('تم إضافة كود الدولة');
      }
      
      cleanedRow.phone_number = phone;
      
      // Validate length
      if (phone.length !== 12) {
        issues.push('رقم الجوال غير صحيح');
      }
    } else {
      issues.push('رقم الجوال مفقود');
    }
    
    // 3. Validate national ID
    if (row.national_id) {
      const id = row.national_id.toString().replace(/\D/g, '');
      cleanedRow.national_id = id;
      
      if (id.length !== 10) {
        issues.push('رقم الهوية غير صحيح (يجب أن يكون 10 أرقام)');
      }
    } else {
      issues.push('رقم الهوية مفقود');
    }
    
    // 4. Validate numbers
    cleanedRow.orders_count = parseInt(row.orders_count?.toString() || '0');
    cleanedRow.total_revenue = parseFloat(row.total_revenue?.toString() || '0');
    
    if (cleanedRow.orders_count < 0) {
      issues.push('عدد الطلبات سالب');
      cleanedRow.orders_count = 0;
    }
    
    if (cleanedRow.total_revenue < 0) {
      issues.push('الإيرادات سالبة');
      cleanedRow.total_revenue = 0;
    }
    
    // 5. Standardize platform name
    const platformMap: Record<string, string> = {
      'جاهز': 'Jahez',
      'هنقرستيشن': 'HungerStation',
      'مرسول': 'Marsool',
      'توصيل': 'Jahez'
    };
    
    if (row.platform && platformMap[row.platform]) {
      cleanedRow.platform = platformMap[row.platform];
      issues.push('تم توحيد اسم المنصة');
    }
    
    // 6. Validate date
    if (row.date) {
      try {
        const date = new Date(row.date);
        if (isNaN(date.getTime())) {
          issues.push('التاريخ غير صحيح');
          cleanedRow.date = new Date().toISOString().split('T')[0];
        } else {
          cleanedRow.date = date.toISOString().split('T')[0];
        }
      } catch (error) {
        issues.push('التاريخ غير صحيح');
        cleanedRow.date = new Date().toISOString().split('T')[0];
      }
    }
    
    // Calculate confidence score
    const confidence = Math.max(0, 100 - (issues.length * 10));
    
    cleaned.push({
      original: row,
      cleaned: cleanedRow,
      issues,
      confidence
    });
  }
  
  return cleaned;
};
```

### المرحلة 4: تطبيق الحسابات (Apply Calculations)

```typescript
// Salary calculation engine
interface SalaryCalculation {
  courierId: string;
  courierName: string;
  totalOrders: number;
  totalRevenue: number;
  baseSalary: number;
  commission: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  breakdown: {
    perOrderRate: number;
    revenuePercentage: number;
    qualityBonus: number;
    attendanceBonus: number;
  };
}

const calculateSalary = async (
  row: ExcelRow,
  courierData: any
): Promise<SalaryCalculation> => {
  // Get courier configuration
  const config = await getCourierConfiguration(courierData);
  
  // Base calculations
  let baseSalary = 0;
  let commission = 0;
  let bonuses = 0;
  let deductions = 0;
  
  // 1. Calculate based on courier status
  if (row.courier_status === 'مركب') {
    // Own vehicle - higher commission
    const perOrderRate = config.ownVehicleRate || 10; // 10 SAR per order
    baseSalary = row.orders_count * perOrderRate;
    
    // Revenue percentage
    const revenuePercentage = config.ownVehicleRevPercent || 0.15; // 15%
    commission = row.total_revenue * revenuePercentage;
  } else {
    // Company vehicle - lower commission
    const perOrderRate = config.companyVehicleRate || 7; // 7 SAR per order
    baseSalary = row.orders_count * perOrderRate;
    
    const revenuePercentage = config.companyVehicleRevPercent || 0.10; // 10%
    commission = row.total_revenue * revenuePercentage;
    
    // Deduct vehicle maintenance
    deductions += config.vehicleMaintenance || 200; // 200 SAR/month
  }
  
  // 2. Vehicle type bonus
  if (row.vehicle_type === 'دراجة') {
    bonuses += config.motorcycleBonus || 300; // 300 SAR bonus
  }
  
  // 3. Platform-specific adjustments
  const platformRates: Record<string, number> = {
    'Jahez': 1.0,
    'HungerStation': 1.05,
    'Marsool': 0.95
  };
  
  const platformMultiplier = platformRates[row.platform] || 1.0;
  baseSalary *= platformMultiplier;
  commission *= platformMultiplier;
  
  // 4. Performance bonuses
  if (row.orders_count >= 200) {
    bonuses += 500; // High performance bonus
  } else if (row.orders_count >= 150) {
    bonuses += 300;
  } else if (row.orders_count >= 100) {
    bonuses += 150;
  }
  
  // 5. Quality score bonus (if available)
  const qualityScore = (row as any).quality_score || 0;
  if (qualityScore >= 4.8) {
    bonuses += 200;
  } else if (qualityScore >= 4.5) {
    bonuses += 100;
  }
  
  // 6. Calculate net salary
  const netSalary = baseSalary + commission + bonuses - deductions;
  
  return {
    courierId: courierData.id,
    courierName: row.courier_name,
    totalOrders: row.orders_count,
    totalRevenue: row.total_revenue,
    baseSalary: Math.round(baseSalary * 100) / 100,
    commission: Math.round(commission * 100) / 100,
    bonuses: Math.round(bonuses * 100) / 100,
    deductions: Math.round(deductions * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100,
    breakdown: {
      perOrderRate: config.ownVehicleRate || config.companyVehicleRate,
      revenuePercentage: config.ownVehicleRevPercent || config.companyVehicleRevPercent,
      qualityBonus: qualityScore >= 4.5 ? (qualityScore >= 4.8 ? 200 : 100) : 0,
      attendanceBonus: row.orders_count >= 100 ? 150 : 0
    }
  };
};

// Helper: Get courier configuration
const getCourierConfiguration = async (courierData: any) => {
  // This would be fetched from database
  return {
    ownVehicleRate: 10,
    ownVehicleRevPercent: 0.15,
    companyVehicleRate: 7,
    companyVehicleRevPercent: 0.10,
    vehicleMaintenance: 200,
    motorcycleBonus: 300
  };
};
```

### المرحلة 5: نظام الاعتماد (Approval System)

```typescript
// Multi-level approval workflow
enum ApprovalStatus {
  PENDING = 'pending',
  FINANCE_APPROVED = 'finance_approved',
  ACCOUNTING_APPROVED = 'accounting_approved',
  HR_APPROVED = 'hr_approved',
  VEHICLE_APPROVED = 'vehicle_approved',
  FINAL_APPROVED = 'final_approved',
  REJECTED = 'rejected'
}

interface ApprovalWorkflow {
  id: string;
  uploadId: string;
  status: ApprovalStatus;
  currentStep: number;
  steps: ApprovalStep[];
  createdAt: Date;
  updatedAt: Date;
}

interface ApprovalStep {
  step: number;
  department: string;
  approver: string | null;
  status: 'pending' | 'approved' | 'rejected';
  comments: string | null;
  approvedAt: Date | null;
}

const createApprovalWorkflow = async (uploadId: string): Promise<ApprovalWorkflow> => {
  const workflow: ApprovalWorkflow = {
    id: generateId(),
    uploadId,
    status: ApprovalStatus.PENDING,
    currentStep: 1,
    steps: [
      {
        step: 1,
        department: 'finance',
        approver: null,
        status: 'pending',
        comments: null,
        approvedAt: null
      },
      {
        step: 2,
        department: 'accounting',
        approver: null,
        status: 'pending',
        comments: null,
        approvedAt: null
      },
      {
        step: 3,
        department: 'hr',
        approver: null,
        status: 'pending',
        comments: null,
        approvedAt: null
      },
      {
        step: 4,
        department: 'vehicle',
        approver: null,
        status: 'pending',
        comments: null,
        approvedAt: null
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Save to database
  await db.approvalWorkflow.create({ data: workflow });
  
  // Notify first approver (Finance)
  await notifyApprover('finance', workflow.id);
  
  return workflow;
};

// Approve step
const approveStep = async (
  workflowId: string,
  department: string,
  approverId: string,
  comments?: string
) => {
  const workflow = await db.approvalWorkflow.findUnique({
    where: { id: workflowId }
  });
  
  if (!workflow) {
    throw new Error('Workflow not found');
  }
  
  // Find current step
  const step = workflow.steps.find(s => s.department === department && s.status === 'pending');
  
  if (!step) {
    throw new Error('Invalid step or already approved');
  }
  
  // Update step
  step.approver = approverId;
  step.status = 'approved';
  step.comments = comments || null;
  step.approvedAt = new Date();
  
  // Move to next step
  workflow.currentStep++;
  workflow.updatedAt = new Date();
  
  // Check if all steps approved
  if (workflow.steps.every(s => s.status === 'approved')) {
    workflow.status = ApprovalStatus.FINAL_APPROVED;
    
    // Send to Elasticsearch
    await sendToElasticsearch(workflow.uploadId);
    
    // Update Power BI
    await updatePowerBI(workflow.uploadId);
    
    // Notify couriers
    await notifyCouriers(workflow.uploadId);
  } else {
    // Notify next approver
    const nextStep = workflow.steps.find(s => s.status === 'pending');
    if (nextStep) {
      await notifyApprover(nextStep.department, workflowId);
    }
  }
  
  // Save workflow
  await db.approvalWorkflow.update({
    where: { id: workflowId },
    data: workflow
  });
  
  return workflow;
};
```

---

## 🎨 واجهة المستخدم (UI Components)

### 1. Excel Upload Page

```tsx
// src/pages/ExcelUpload.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function ExcelUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    // Upload logic here
    setUploading(false);
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">رفع ملف Excel اليومي</h1>
      
      <Card className="p-6">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-gray-500">
                <p className="text-lg">اسحب الملف هنا أو اضغط للتحميل</p>
                <p className="text-sm mt-2">ملفات Excel (.xlsx, .xls) حتى 10 ميجا</p>
              </div>
            </label>
            
            {file && (
              <div className="mt-4">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} ميجا
                </p>
              </div>
            )}
          </div>
          
          {uploading && (
            <Progress value={progress} className="w-full" />
          )}
          
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? 'جاري الرفع...' : 'رفع الملف'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

### 2. Approval Dashboard

```tsx
// src/pages/ApprovalDashboard.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ApprovalDashboard() {
  return (
    <div className="container mx-auto p-6" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">لوحة الاعتماد</h1>
      
      <div className="grid gap-4">
        {/* Approval card */}
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium">ملف Excel - 2026-02-18</h3>
              <p className="text-sm text-gray-500 mt-1">
                150 مندوب | 22,500 طلب | 675,000 ريال
              </p>
            </div>
            
            <Badge>قيد المراجعة</Badge>
          </div>
          
          <div className="mt-4 space-y-2">
            <ApprovalStep 
              step="قسم المالية" 
              status="approved" 
              approver="محمد أحمد"
            />
            <ApprovalStep 
              step="المحاسبة" 
              status="pending" 
            />
            <ApprovalStep 
              step="الموارد البشرية" 
              status="pending" 
            />
            <ApprovalStep 
              step="قسم المركبات" 
              status="pending" 
            />
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button>اعتماد</Button>
            <Button variant="outline">رفض</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
```

---

## 🔒 الأمان (Security)

1. **التحقق من الملفات:**
   - فحص امتداد الملف
   - فحص حجم الملف
   - فحص محتوى الملف (malware scan)

2. **صلاحيات الوصول:**
   - فقط موظفو المالية يمكنهم رفع الملفات
   - كل قسم يرى فقط ما يخصه
   - تسجيل كل عملية (audit log)

3. **تشفير البيانات:**
   - تشفير الملفات في S3
   - تشفير البيانات الحساسة في قاعدة البيانات
   - HTTPS فقط للاتصالات

---

## 📊 التقارير (Reports)

بعد الاعتماد النهائي، يتم إنشاء:

1. **تقرير شامل:**
   - إجمالي المناديب
   - إجمالي الطلبات
   - إجمالي الإيرادات
   - إجمالي المستحقات

2. **تقرير لكل مندوب:**
   - الطلبات والإيرادات
   - الحسابات التفصيلية
   - المستحق النهائي

3. **تقرير لكل منصة:**
   - عدد المناديب
   - إجمالي الطلبات
   - الأداء العام

---

**تاريخ التحديث:** فبراير 2026  
**الإصدار:** 1.0  
**الحالة:** جاهز للتطبيق ✅
