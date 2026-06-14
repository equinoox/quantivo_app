import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { InventoryListDetail, InventoryListFinancialEntryDetail, InventoryListProductDetail } from "@/features/inventory/types/inventory.types";

type InventoryPdfLabels = {
  createdAt: string;
  createdBy: string;
  end: string;
  entered: string;
  expense: string;
  explanation: string;
  firstShift: string;
  inventory: string;
  inventoryDate: string;
  inventorySummary: string;
  listId: string;
  name: string;
  noExplanation: string;
  notAvailable: string;
  pdfAmount: string;
  price: string;
  products: string;
  quantity: string;
  revenue: string;
  revenuesExpensesManagement: string;
  secondShift: string;
  shift: string;
  sold: string;
  totalEarn: string;
  totalEarnings: string;
  totalExpenses: string;
  totalProductEarnings: string;
  totalRevenues: string;
  type: string;
  updatedAt: string;
};

type ExportInventoryListPdfInput = {
  fileName: string;
  formatDateTime: (value: string) => string;
  formatMoney: (value: number) => string;
  labels: InventoryPdfLabels;
  list: InventoryListDetail;
};

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? value.toString() : value.toString();
}

function sanitizeFileName(fileName: string): string {
  const safeName = fileName.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_");
  return safeName.toLowerCase().endsWith(".pdf") ? safeName : `${safeName}.pdf`;
}

function buildProductRow(product: InventoryListProductDetail, labels: InventoryPdfLabels, formatMoney: (value: number) => string): string {
  return `
    <tr>
      <td>${escapeHtml(product.productNameSnapshot)}</td>
      <td class="number">${escapeHtml(formatQuantity(product.kolicina))}</td>
      <td class="number">${escapeHtml(product.isCounterProduct ? labels.notAvailable : formatQuantity(product.uneto))}</td>
      <td class="number">${escapeHtml(formatQuantity(product.kraj))}</td>
      <td class="number">${escapeHtml(formatQuantity(product.prodato))}</td>
      <td class="number">${escapeHtml(formatMoney(product.priceSnapshot))}</td>
      <td class="number strong">${escapeHtml(formatMoney(product.totalEarning))}</td>
    </tr>
  `;
}

function buildFinancialRow(entry: InventoryListFinancialEntryDetail, labels: InventoryPdfLabels, formatMoney: (value: number) => string): string {
  return `
    <tr>
      <td>${escapeHtml(entry.nameSnapshot)}</td>
      <td>${escapeHtml(entry.typeSnapshot === "revenue" ? labels.revenue : labels.expense)}</td>
      <td class="number strong">${escapeHtml(formatMoney(entry.amount))}</td>
      <td>${escapeHtml(entry.explanation || labels.noExplanation)}</td>
    </tr>
  `;
}

function buildInventoryListHtml({ formatDateTime, formatMoney, labels, list }: Omit<ExportInventoryListPdfInput, "fileName">): string {
  const totalProductEarnings = list.products.reduce((total, item) => total + item.totalEarning, 0);
  const totalRevenues = list.financialEntries.reduce((total, item) => item.typeSnapshot === "revenue" ? total + item.amount : total, 0);
  const totalExpenses = list.financialEntries.reduce((total, item) => item.typeSnapshot === "expense" ? total + item.amount : total, 0);
  const totalEarn = totalProductEarnings + totalRevenues - totalExpenses;
  const shift = list.shift === "first" ? labels.firstShift : labels.secondShift;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body { color: #243447; font-family: Arial, sans-serif; margin: 32px; }
          .brand { color: #1f3349; font-size: 30px; font-weight: 800; letter-spacing: 0; }
          .dash { background: #f97316; height: 4px; margin: 8px 0 24px; width: 132px; }
          .section { border: 1px solid #d9e2ec; border-radius: 8px; margin-top: 16px; padding: 16px; }
          .section-title { color: #1f3349; font-size: 16px; font-weight: 700; margin-bottom: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; }
          .label { color: #6b7280; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .value { font-size: 13px; font-weight: 600; margin-top: 3px; }
          table { border-collapse: collapse; font-size: 11px; width: 100%; }
          th { background: #1f3349; color: #ffffff; font-size: 10px; padding: 8px 6px; text-align: left; text-transform: uppercase; }
          td { border-bottom: 1px solid #e5edf4; padding: 8px 6px; vertical-align: top; }
          .number { text-align: right; white-space: nowrap; }
          .strong { font-weight: 700; }
          .summary { background: #f8fafc; border: 1px solid #d9e2ec; border-radius: 8px; padding: 14px; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .summary-total { border-top: 1px solid #d9e2ec; color: #166534; font-size: 17px; font-weight: 800; margin-top: 10px; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="brand">Quantivo</div>
        <div class="dash"></div>

        <div class="section">
          <div class="section-title">${escapeHtml(labels.inventory)}</div>
          <div class="grid">
            <div><div class="label">${escapeHtml(labels.listId)}</div><div class="value">${escapeHtml(list.id)}</div></div>
            <div><div class="label">${escapeHtml(labels.inventoryDate)}</div><div class="value">${escapeHtml(list.date)}</div></div>
            <div><div class="label">${escapeHtml(labels.shift)}</div><div class="value">${escapeHtml(shift)}</div></div>
            <div><div class="label">${escapeHtml(labels.createdBy)}</div><div class="value">${escapeHtml(list.createdByUserName)}</div></div>
            <div><div class="label">${escapeHtml(labels.createdAt)}</div><div class="value">${escapeHtml(formatDateTime(list.createdAt))}</div></div>
            <div><div class="label">${escapeHtml(labels.updatedAt)}</div><div class="value">${escapeHtml(formatDateTime(list.updatedAt))}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">${escapeHtml(labels.products)}</div>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(labels.name)}</th>
                <th class="number">${escapeHtml(labels.quantity)}</th>
                <th class="number">${escapeHtml(labels.entered)}</th>
                <th class="number">${escapeHtml(labels.end)}</th>
                <th class="number">${escapeHtml(labels.sold)}</th>
                <th class="number">${escapeHtml(labels.price)}</th>
                <th class="number">${escapeHtml(labels.totalEarnings)}</th>
              </tr>
            </thead>
            <tbody>${list.products.map((product) => buildProductRow(product, labels, formatMoney)).join("")}</tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">${escapeHtml(labels.revenuesExpensesManagement)}</div>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(labels.name)}</th>
                <th>${escapeHtml(labels.type)}</th>
                <th class="number">${escapeHtml(labels.pdfAmount)}</th>
                <th>${escapeHtml(labels.explanation)}</th>
              </tr>
            </thead>
            <tbody>${list.financialEntries.map((entry) => buildFinancialRow(entry, labels, formatMoney)).join("")}</tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">${escapeHtml(labels.inventorySummary)}</div>
          <div class="summary">
            <div class="summary-row"><span>${escapeHtml(labels.totalProductEarnings)}</span><strong>${escapeHtml(formatMoney(totalProductEarnings))}</strong></div>
            <div class="summary-row"><span>${escapeHtml(labels.totalRevenues)}</span><strong>${escapeHtml(formatMoney(totalRevenues))}</strong></div>
            <div class="summary-row"><span>${escapeHtml(labels.totalExpenses)}</span><strong>${escapeHtml(formatMoney(totalExpenses))}</strong></div>
            <div class="summary-row summary-total"><span>${escapeHtml(labels.totalEarn)}</span><span>${escapeHtml(formatMoney(totalEarn))}</span></div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function exportInventoryListToPdf(input: ExportInventoryListPdfInput): Promise<string> {
  const result = await Print.printToFileAsync({ base64: true, html: buildInventoryListHtml(input) });
  const shareUri = FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}${sanitizeFileName(input.fileName)}` : result.uri;
  if (result.base64 && FileSystem.cacheDirectory) {
    await FileSystem.writeAsStringAsync(shareUri, result.base64, { encoding: FileSystem.EncodingType.Base64 });
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, {
      dialogTitle: input.fileName,
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
    });
  }
  return shareUri;
}
