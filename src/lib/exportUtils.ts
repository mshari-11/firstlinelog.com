import * as XLSX from "xlsx";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FinanceRecord {
  courier_name?: string;
  period_start: string;
  period_end: string;
  gross_revenue: number;
  net_payout: number;
  payment_status: string;
  platform_fees?: number;
  vehicle_deductions?: number;
  absence_deductions?: number;
  other_deductions?: number;
}

// ---------------------------------------------------------------------------
// 1. Generic Excel export
// ---------------------------------------------------------------------------

export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = "Sheet1",
): void {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-fit column widths based on content
  const headers = Object.keys(data[0] ?? {});
  worksheet["!cols"] = headers.map((header) => {
    const maxContentLen = data.reduce((max, row) => {
      const cellValue = String(row[header] ?? "");
      return Math.max(max, cellValue.length);
    }, header.length);
    return { wch: Math.min(maxContentLen + 4, 50) };
  });

  // RTL sheet direction
  worksheet["!dir"] = "rtl";

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Write with BOM for Arabic support
  const wbOut = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    bookSST: true,
  });

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), wbOut], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadBlob(blob, `${filename}.xlsx`);
}

// ---------------------------------------------------------------------------
// 2. PDF export via print window (HTML-based, full Arabic/RTL support)
// ---------------------------------------------------------------------------

export function exportToPDF(
  title: string,
  headers: string[],
  rows: string[][],
  filename: string,
): void {
  const date = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const headerCells = headers
    .map(
      (h) =>
        `<th style="padding:10px 14px;background:#3b82f6;color:#fff;font-weight:600;border:1px solid #d1d5db;white-space:nowrap;">${h}</th>`,
    )
    .join("");

  const bodyRows = rows
    .map((row) => {
      const cells = row
        .map(
          (cell) =>
            `<td style="padding:8px 14px;border:1px solid #d1d5db;text-align:right;">${cell}</td>`,
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      padding: 40px;
      color: #1f2937;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
    }
    .company-ar { font-size: 22px; font-weight: 700; color: #1e3a5f; }
    .company-en { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .report-title { font-size: 18px; font-weight: 600; margin-top: 12px; color: #1f2937; }
    .report-date { font-size: 13px; color: #6b7280; margin-top: 6px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      font-size: 14px;
    }
    tr:nth-child(even) { background: #f9fafb; }
    @media print {
      @page { size: A4 landscape; margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-ar">الخط الأول للخدمات اللوجستية</div>
    <div class="company-en">First Line Logistics</div>
    <div class="report-title">${title}</div>
    <div class="report-date">${date}</div>
  </div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

// ---------------------------------------------------------------------------
// 3. Finance-specific Excel export
// ---------------------------------------------------------------------------

const FINANCE_HEADERS: Record<string, string> = {
  courier_name: "المندوب",
  period_start: "بداية الفترة",
  period_end: "نهاية الفترة",
  gross_revenue: "إجمالي الإيرادات",
  net_payout: "صافي المستحق",
  payment_status: "الحالة",
  platform_fees: "رسوم المنصة",
  vehicle_deductions: "خصومات المركبات",
  absence_deductions: "خصومات الغياب",
  other_deductions: "خصومات أخرى",
};

const STATUS_AR: Record<string, string> = {
  paid: "مدفوع",
  pending: "معلّق",
  overdue: "متأخر",
  processing: "قيد المعالجة",
};

function formatNumber(value: number): string {
  return value.toLocaleString("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function exportFinanceToExcel(
  records: FinanceRecord[],
  filename: string = "finance-report",
): void {
  const mappedRows = records.map((r) => ({
    [FINANCE_HEADERS.courier_name]: r.courier_name ?? "—",
    [FINANCE_HEADERS.period_start]: r.period_start,
    [FINANCE_HEADERS.period_end]: r.period_end,
    [FINANCE_HEADERS.gross_revenue]: formatNumber(r.gross_revenue),
    [FINANCE_HEADERS.net_payout]: formatNumber(r.net_payout),
    [FINANCE_HEADERS.payment_status]:
      STATUS_AR[r.payment_status] ?? r.payment_status,
    [FINANCE_HEADERS.platform_fees]: formatNumber(r.platform_fees ?? 0),
    [FINANCE_HEADERS.vehicle_deductions]: formatNumber(
      r.vehicle_deductions ?? 0,
    ),
    [FINANCE_HEADERS.absence_deductions]: formatNumber(
      r.absence_deductions ?? 0,
    ),
    [FINANCE_HEADERS.other_deductions]: formatNumber(r.other_deductions ?? 0),
  }));

  // Summary row
  const totals = records.reduce(
    (acc, r) => ({
      gross_revenue: acc.gross_revenue + r.gross_revenue,
      net_payout: acc.net_payout + r.net_payout,
      platform_fees: acc.platform_fees + (r.platform_fees ?? 0),
      vehicle_deductions:
        acc.vehicle_deductions + (r.vehicle_deductions ?? 0),
      absence_deductions:
        acc.absence_deductions + (r.absence_deductions ?? 0),
      other_deductions: acc.other_deductions + (r.other_deductions ?? 0),
    }),
    {
      gross_revenue: 0,
      net_payout: 0,
      platform_fees: 0,
      vehicle_deductions: 0,
      absence_deductions: 0,
      other_deductions: 0,
    },
  );

  mappedRows.push({
    [FINANCE_HEADERS.courier_name]: "الإجمالي",
    [FINANCE_HEADERS.period_start]: "",
    [FINANCE_HEADERS.period_end]: "",
    [FINANCE_HEADERS.gross_revenue]: formatNumber(totals.gross_revenue),
    [FINANCE_HEADERS.net_payout]: formatNumber(totals.net_payout),
    [FINANCE_HEADERS.payment_status]: "",
    [FINANCE_HEADERS.platform_fees]: formatNumber(totals.platform_fees),
    [FINANCE_HEADERS.vehicle_deductions]: formatNumber(
      totals.vehicle_deductions,
    ),
    [FINANCE_HEADERS.absence_deductions]: formatNumber(
      totals.absence_deductions,
    ),
    [FINANCE_HEADERS.other_deductions]: formatNumber(totals.other_deductions),
  });

  exportToExcel(mappedRows, filename, "التقرير المالي");
}

// ---------------------------------------------------------------------------
// 4. Print report
// ---------------------------------------------------------------------------

export function printReport(
  title: string,
  content: HTMLElement | string,
): void {
  const date = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const bodyContent =
    typeof content === "string" ? content : content.outerHTML;

  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4; margin: 15mm; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      padding: 40px;
      color: #1f2937;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
    }
    .company-ar { font-size: 22px; font-weight: 700; color: #1e3a5f; }
    .company-en { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .report-title { font-size: 18px; font-weight: 600; margin-top: 12px; color: #1f2937; }
    .report-date { font-size: 13px; color: #6b7280; margin-top: 6px; }
    .content { margin-top: 24px; line-height: 1.8; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 12px; border: 1px solid #d1d5db; text-align: right; }
    th { background: #3b82f6; color: #fff; font-weight: 600; }
    tr:nth-child(even) { background: #f9fafb; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-ar">الخط الأول للخدمات اللوجستية</div>
    <div class="company-en">First Line Logistics</div>
    <div class="report-title">${title}</div>
    <div class="report-date">${date}</div>
  </div>
  <div class="content">${bodyContent}</div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
