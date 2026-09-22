import ExcelJS from "exceljs";

const COLORS = {
  headerBg: "1F4E79",
  headerText: "FFFFFF",
  subHeaderBg: "D6E4F0",
  subHeaderText: "1F4E79",
  totalBg: "E2EFDA",
  totalText: "375623",
  bankBg: "FFF2CC",
  bankText: "7F6000",
  lightGray: "F2F2F2",
  border: "B4C6E7",
  accent: "C4683F",
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLORS.border } },
  left: { style: "thin", color: { argb: COLORS.border } },
  bottom: { style: "thin", color: { argb: COLORS.border } },
  right: { style: "thin", color: { argb: COLORS.border } },
};

function toDirectImageUrl(link: string): string {
  if (!link) return "";
  const match = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  const openMatch = link.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
  return link;
}

function setHeaderRow(row: ExcelJS.Row, values: string[]) {
  row.values = values;
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
    cell.font = { color: { argb: COLORS.headerText }, bold: true, size: 10, name: "Arial" };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = THIN_BORDER;
  });
  row.height = 24;
}

function setDataRow(row: ExcelJS.Row, values: any[], isAlt: boolean) {
  row.values = values;
  row.eachCell((cell, colNum) => {
    if (isAlt) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.lightGray } };
    cell.font = { size: 9, name: "Arial" };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = THIN_BORDER;
    if (colNum >= 6 && colNum <= 8) cell.alignment = { horizontal: "right", vertical: "middle" };
  });
  row.height = 20;
}

function setTotalRow(row: ExcelJS.Row, values: any[]) {
  row.values = values;
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.totalBg } };
    cell.font = { color: { argb: COLORS.totalText }, bold: true, size: 10, name: "Arial" };
    cell.alignment = { vertical: "middle" };
    cell.border = THIN_BORDER;
  });
  row.height = 22;
}

export interface ExportItem {
  yarnName?: string;
  yarnCount?: string;
  composition?: string;
  factoryName?: string;
  colorName?: string;
  colorCode?: string;
  colorReference?: string;
  quantity?: string;
  unitPrice?: number;
  currency?: string;
  unit?: string;
  weightBasis?: string;
  incoterms?: string;
  amount?: number;
  notes?: string;
  description?: string;
  lotNo?: string;
  packages?: number;
  grossWeight?: string;
  netWeight?: string;
}

export interface ExportData {
  docType: "Purchase Order" | "Delivery Note" | "Sales Invoice" | "Supplier Invoice";
  docNo: string;
  date: string;
  company?: { name: string; officialName?: string; address?: string; telephone?: string; logoPath?: string };
  party?: { name: string; officialName?: string; address?: string; telephone?: string };
  shipTo?: { name: string; address?: string };
  reference?: string;
  customerPoNo?: string;
  deliveryDate?: string;
  paymentTerms?: string;
  currency?: string;
  incoterms?: string;
  status?: string;
  items: ExportItem[];
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  total?: number;
  bankInfo?: { bankName: string; accountName?: string; accountNumber?: string; swiftCode?: string; iban?: string; branch?: string; bankCode?: string };
  notes?: string;
}

export async function generateExcel(data: ExportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Fiborge Yarn Intelligence";
  wb.created = new Date();

  const ws = wb.addWorksheet(data.docType, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0, // 智慧分頁：寬度強縮一頁，高度超出自動分頁
      margins: { left: 0.3, right: 0.3, top: 0.3, bottom: 0.45, header: 0.15, footer: 0.2 }
    },
    properties: { defaultRowHeight: 16 },
    views: [{ showGridLines: false }] // 隱藏多餘背景網格線，讓列印外觀潔淨
  });

  ws.columns = [
    { width: 4 }, { width: 22 }, { width: 14 }, { width: 14 }, { width: 16 },
    { width: 10 }, { width: 12 }, { width: 14 }, { width: 10 }, { width: 12 }, { width: 18 },
  ];

  let row = 1;

  // ===== LOGO & COMPANY BRANDING (左上) =====
  let logoImageId: number | null = null;
  if (data.company?.logoPath) {
    try {
      const logoUrl = toDirectImageUrl(data.company.logoPath);
      const logoResponse = await fetch(logoUrl, { redirect: "follow" });
      if (logoResponse.ok) {
        const logoBuffer = await logoResponse.arrayBuffer();
        const ext = logoUrl.includes(".png") ? "png" : "jpeg";
        logoImageId = wb.addImage({
          buffer: logoBuffer as unknown as ExcelJS.Buffer,
          extension: ext as "png" | "jpeg",
        });
      }
    } catch (logoErr) {
      console.warn("Could not load company logo:", logoErr);
    }
  }

  // 給 Logo 留出大約 3 行高度
  if (logoImageId !== null) {
    ws.addImage(logoImageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 120, height: 40 },
    });
    row += 3;
  } else {
    // 沒有圖片時直接文字化 Logo
    const logoTextRow = ws.getRow(row++);
    logoTextRow.getCell(1).value = data.company?.name || "FIBORGE";
    logoTextRow.getCell(1).font = { size: 18, bold: true, color: { argb: COLORS.accent }, name: "Arial" };
    ws.mergeCells(`A${row - 1}:E${row - 1}`);
  }

  // 🆕 在 Logo 正下方補上：公司英文、中文登記全名（不再有 Emoji 與多餘點點）
  const companyNameRow = ws.getRow(row++);
  companyNameRow.getCell(1).value = `${data.company?.officialName || "FIBORGE COMPANY LIMITED"}\n富維企業有限公司`;
  companyNameRow.getCell(1).font = { size: 9, bold: true, color: { argb: "333333" }, name: "Arial" };
  companyNameRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
  companyNameRow.height = 28;
  ws.mergeCells(`A${row - 1}:E${row - 1}`);

  // 右上角：文件類型大標題
  const docTypeCell = ws.getCell(`F1`);
  docTypeCell.value = data.docType.toUpperCase();
  docTypeCell.font = { size: 16, bold: true, color: { argb: COLORS.headerBg }, name: "Arial" };
  docTypeCell.alignment = { horizontal: "right", vertical: "middle" };
  ws.mergeCells(`F1:K2`);

  row += 1;

  // Info Block (From & Doc details)
  const infoStart = row;
  ws.getCell(`A${row}`).value = "From:";
  ws.getCell(`A${row}`).font = { bold: true, size: 9, color: { argb: COLORS.subHeaderText }, name: "Arial" };
  ws.getCell(`B${row}`).value = data.company?.name || "";
  ws.getCell(`B${row}`).font = { bold: true, size: 9, name: "Arial" };
  row++;
  if (data.company?.address) {
    ws.getCell(`B${row}`).value = data.company.address;
    ws.getCell(`B${row}`).font = { size: 8, name: "Arial" };
    row++;
  }
  if (data.company?.telephone) {
    ws.getCell(`B${row}`).value = `Tel: ${data.company.telephone}`;
    ws.getCell(`B${row}`).font = { size: 8, name: "Arial" };
    row++;
  }

  const r = infoStart;
  ws.getCell(`G${r}`).value = "Doc No:"; ws.getCell(`G${r}`).font = { bold: true, size: 9, name: "Arial" };
  ws.getCell(`H${r}`).value = data.docNo; ws.getCell(`H${r}`).font = { bold: true, size: 9, color: { argb: COLORS.accent }, name: "Arial" };
  ws.getCell(`G${r + 1}`).value = "Date:"; ws.getCell(`G${r + 1}`).font = { bold: true, size: 9, name: "Arial" };
  ws.getCell(`H${r + 1}`).value = data.date;
  if (data.status) { ws.getCell(`G${r + 2}`).value = "Status:"; ws.getCell(`G${r + 2}`).font = { bold: true, size: 9, name: "Arial" }; ws.getCell(`H${r + 2}`).value = data.status; }
  if (data.currency) { ws.getCell(`G${r + 3}`).value = "Currency:"; ws.getCell(`G${r + 3}`).font = { bold: true, size: 9, name: "Arial" }; ws.getCell(`H${r + 3}`).value = data.currency; }
  row = Math.max(row, r + 4) + 1;

  // Party / Ship To
  if (data.party) {
    const partyLabel = data.docType === "Purchase Order" || data.docType === "Supplier Invoice" ? "Supplier:" : "Client:";
    ws.getCell(`A${row}`).value = partyLabel; ws.getCell(`A${row}`).font = { bold: true, size: 9, color: { argb: COLORS.subHeaderText }, name: "Arial" };
    ws.getCell(`B${row}`).value = data.party.name; ws.getCell(`B${row}`).font = { bold: true, size: 9, name: "Arial" };
    ws.getCell(`G${row}`).value = data.reference ? "Ref:" : (data.customerPoNo ? "Client PO:" : ""); ws.getCell(`G${row}`).font = { bold: true, size: 9, name: "Arial" };
    ws.getCell(`H${row}`).value = data.reference || data.customerPoNo || "";
    row++;
    if (data.party.address) {
      ws.getCell(`B${row}`).value = data.party.address; ws.getCell(`B${row}`).font = { size: 8, name: "Arial" };
      ws.getCell(`G${row}`).value = data.deliveryDate ? "Delivery:" : ""; ws.getCell(`G${row}`).font = { bold: true, size: 9, name: "Arial" };
      ws.getCell(`H${row}`).value = data.deliveryDate || "";
      row++;
    }
    if (data.paymentTerms) {
      ws.getCell(`G${row}`).value = "Payment:"; ws.getCell(`G${row}`).font = { bold: true, size: 9, name: "Arial" };
      ws.getCell(`H${row}`).value = data.paymentTerms;
      row++;
    }
    row++;
  }

  // Items table
  const isDN = data.docType === "Delivery Note";
  const headers = isDN
    ? ["#", "Yarn", "Count", "Color", "Lot No", "Qty", "Packages", "Gross Wt", "Net Wt", "", "Remarks"]
    : ["#", "Yarn", "Spec", "Color", "Color Ref", "Qty", "Unit Price", "Amount", "Weight", "Incoterms", "Remarks"];
  setHeaderRow(ws.getRow(row++), headers);

  data.items.forEach((item, i) => {
    const vals = isDN
      ? [i + 1, item.yarnName || item.description || "", item.yarnCount || "", item.colorName || "", item.lotNo || "", item.quantity || "", item.packages || "", item.grossWeight || "", item.netWeight || "", "", item.notes || ""]
      : [i + 1, item.yarnName || item.description || "", item.yarnCount || item.composition || "", item.colorName || "", item.colorReference || item.colorCode || "", item.quantity || "", item.unitPrice ? `${item.currency || ""} ${item.unitPrice.toFixed(2)}` : "", item.amount ? `${item.currency || ""} ${item.amount.toFixed(2)}` : "", item.weightBasis || "", item.incoterms || "", item.notes || ""];
    setDataRow(ws.getRow(row++), vals, i % 2 === 1);
  });

  // Totals
  if (!isDN && data.total !== undefined) {
    row++;
    setTotalRow(ws.getRow(row++), ["", "", "", "", "", "", "Subtotal:", data.subtotal ? `${data.currency || ""} ${data.subtotal.toFixed(2)}` : "", "", "", ""]);
    if (data.vatRate) { setTotalRow(ws.getRow(row++), ["", "", "", "", "", "", `VAT (${data.vatRate}%):`, data.vatAmount ? `${data.currency || ""} ${data.vatAmount.toFixed(2)}` : "", "", "", ""]); }
    const grandRow = ws.getRow(row++);
    setTotalRow(grandRow, ["", "", "", "", "", "", "TOTAL:", `${data.currency || ""} ${data.total.toFixed(2)}`, "", "", ""]);
    grandRow.eachCell((cell) => { cell.font = { bold: true, size: 12, color: { argb: COLORS.totalText }, name: "Arial" }; });
  }

  // Bank Info
  if (data.bankInfo) {
    row += 2;
    const bankRow = ws.getRow(row++);
    bankRow.getCell(1).value = "Bank Details:";
    bankRow.getCell(1).font = { bold: true, size: 10, color: { argb: COLORS.bankText }, name: "Arial" };
    bankRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bankBg } };
    ws.mergeCells(`A${row - 1}:K${row - 1}`);
    [
      `Beneficiary: ${data.bankInfo.accountName || data.company?.name || ""}`,
      `Bank: ${data.bankInfo.bankName}${data.bankInfo.branch ? ` - ${data.bankInfo.branch}` : ""}`,
      `A/C No: ${data.bankInfo.accountNumber || ""}`,
      data.bankInfo.swiftCode ? `SWIFT: ${data.bankInfo.swiftCode}` : "",
      data.bankInfo.iban ? `IBAN: ${data.bankInfo.iban}` : "",
      data.bankInfo.bankCode ? `Bank Code: ${data.bankInfo.bankCode}` : "",
    ].filter(Boolean).forEach((line) => { const r = ws.getRow(row++); r.getCell(2).value = line; r.getCell(2).font = { size: 9, name: "Arial" }; });
  }

  // 🆕 Notes/Remarks (自動讀取你在 System Settings 後台設定好的備註條款)
  if (data.notes) {
    row += 2;
    ws.getCell(`A${row}`).value = "Remarks:"; ws.getCell(`A${row}`).font = { bold: true, size: 9, name: "Arial" }; row++;
    ws.getCell(`A${row}`).value = data.notes; ws.getCell(`A${row}`).font = { size: 9, name: "Arial" };
    ws.getCell(`A${row}`).alignment = { wrapText: true, vertical: "top" };
    ws.mergeCells(`A${row}:K${row}`);
  }

  // 🆕 印刷化：完全移除底部最末端重複的公司中英文落款 (已經在上方的 Logo 下方補回)
  row += 2;
  ws.getCell(`A${row}`).value = `Generated on ${new Date().toISOString().slice(0, 10)}`;
  ws.getCell(`A${row}`).font = { size: 7, color: { argb: "AAAAAA" }, name: "Arial" };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}