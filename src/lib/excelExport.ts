import ExcelJS from "exceljs";

// 🆕 全新專業黑白灰色調 - 列印友善
const COLORS = {
  black: "000000",
  darkGray: "595959",
  mediumGray: "8C8C8C",
  lightGray: "D9D9D9",
  bgLight: "F5F5F5",
  bgAlt: "FAFAFA",
  white: "FFFFFF",
};

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLORS.lightGray } },
  left: { style: "thin", color: { argb: COLORS.lightGray } },
  bottom: { style: "thin", color: { argb: COLORS.lightGray } },
  right: { style: "thin", color: { argb: COLORS.lightGray } },
};

const BORDER_MEDIUM: Partial<ExcelJS.Borders> = {
  top: { style: "medium", color: { argb: COLORS.darkGray } },
  left: { style: "medium", color: { argb: COLORS.darkGray } },
  bottom: { style: "medium", color: { argb: COLORS.darkGray } },
  right: { style: "medium", color: { argb: COLORS.darkGray } },
};

const BORDER_BOTTOM: Partial<ExcelJS.Borders> = {
  bottom: { style: "medium", color: { argb: COLORS.black } },
};

function toDirectImageUrl(link: string): string {
  if (!link) return "";
  const match = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  const openMatch = link.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
  return link;
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
  // 🆕 Reconciliation 專用
  docNo?: string;
  docDate?: string;
  docType?: string;
  debit?: number;
  credit?: number;
  balance?: number;
}

export interface ExportData {
  docType: "Quotation" | "Purchase Order" | "Delivery Note" | "Sales Invoice" | "Supplier Invoice" | "Reconciliation";
  docNo: string;
  date: string;
  company?: { name: string; officialName?: string; address?: string; telephone?: string; logoPath?: string };
  party?: { name: string; officialName?: string; address?: string; telephone?: string; attn?: string };
  shipTo?: { name: string; address?: string };
  reference?: string;
  customerPoNo?: string;
  deliveryDate?: string;
  paymentTerms?: string;
  currency?: string;
  incoterms?: string;
  status?: string;
  validUntil?: string;
  items: ExportItem[];
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  total?: number;
  bankInfo?: { bankName: string; accountName?: string; accountNumber?: string; swiftCode?: string; iban?: string; branch?: string; bankCode?: string };
  notes?: string;
  // 🆕 Reconciliation 專用
  periodFrom?: string;
  periodTo?: string;
  openingBalance?: number;
  closingBalance?: number;
}

export async function generateExcel(data: ExportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Fiborge Sales & Sourcing Hub";
  wb.created = new Date();

  const ws = wb.addWorksheet(data.docType, {
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.4, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    properties: { defaultRowHeight: 15 },
    views: [{ showGridLines: false }],
  });

  // 統一欄位寬度（適合 A4 直式列印）
  ws.columns = [
    { width: 4 },   // A: #
    { width: 24 },  // B: Yarn/Description
    { width: 12 },  // C: Spec
    { width: 14 },  // D: Color
    { width: 14 },  // E: Reference
    { width: 10 },  // F: Qty
    { width: 12 },  // G: Unit Price
    { width: 14 },  // H: Amount
    { width: 8 },   // I: Weight
    { width: 10 },  // J: Incoterms
    { width: 16 },  // K: Remarks
  ];

  let row = 1;

  // ===================== HEADER AREA =====================
  // Left: Logo + Company Name
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
    } catch (err) {
      console.warn("Logo load failed:", err);
    }
  }

  if (logoImageId !== null) {
    ws.addImage(logoImageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 110, height: 36 },
    });
  }

  // 公司名稱（Logo 下方）
  ws.getRow(3).height = 20;
  ws.getCell("A3").value = data.company?.officialName || data.company?.name || "FIBORGE COMPANY LIMITED";
  ws.getCell("A3").font = { size: 10, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
  ws.mergeCells("A3:E3");

  // Right: Document Type (大標題)
  ws.getCell("G1").value = data.docType.toUpperCase();
  ws.getCell("G1").font = { size: 20, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
  ws.getCell("G1").alignment = { horizontal: "right", vertical: "middle" };
  ws.mergeCells("G1:K2");
  ws.getRow(1).height = 24;
  ws.getRow(2).height = 24;

  // 文件編號 & 日期
  ws.getCell("G3").value = `No: ${data.docNo}`;
  ws.getCell("G3").font = { size: 10, bold: true, color: { argb: COLORS.darkGray }, name: "Calibri" };
  ws.getCell("G3").alignment = { horizontal: "right" };
  ws.mergeCells("G3:K3");

  ws.getCell("G4").value = `Date: ${data.date}`;
  ws.getCell("G4").font = { size: 10, color: { argb: COLORS.darkGray }, name: "Calibri" };
  ws.getCell("G4").alignment = { horizontal: "right" };
  ws.mergeCells("G4:K4");

  if (data.validUntil) {
    ws.getCell("G5").value = `Valid Until: ${data.validUntil}`;
    ws.getCell("G5").font = { size: 10, color: { argb: COLORS.darkGray }, name: "Calibri" };
    ws.getCell("G5").alignment = { horizontal: "right" };
    ws.mergeCells("G5:K5");
  }

  // 水平分隔線
  row = 6;
  for (let c = 1; c <= 11; c++) {
    ws.getCell(row, c).border = BORDER_BOTTOM;
  }
  row++;

  // ===================== PARTY INFO =====================
  const infoStart = row;

  // From (公司)
  ws.getCell(`A${row}`).value = "FROM";
  ws.getCell(`A${row}`).font = { size: 8, bold: true, color: { argb: COLORS.mediumGray }, name: "Calibri" };
  ws.mergeCells(`A${row}:E${row}`);
  row++;
  ws.getCell(`A${row}`).value = data.company?.name || "";
  ws.getCell(`A${row}`).font = { size: 10, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
  ws.mergeCells(`A${row}:E${row}`);
  row++;
  if (data.company?.address) {
    ws.getCell(`A${row}`).value = data.company.address;
    ws.getCell(`A${row}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
    ws.getCell(`A${row}`).alignment = { wrapText: true, vertical: "top" };
    ws.mergeCells(`A${row}:E${row}`);
    ws.getRow(row).height = 30;
    row++;
  }
  if (data.company?.telephone) {
    ws.getCell(`A${row}`).value = `Tel: ${data.company.telephone}`;
    ws.getCell(`A${row}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
    ws.mergeCells(`A${row}:E${row}`);
    row++;
  }

  // To (客戶/紗廠)
  if (data.party) {
    const partyLabel = data.docType === "Purchase Order" || data.docType === "Supplier Invoice" ? "TO (SUPPLIER)" : "TO (CLIENT)";
    let partyRow = infoStart;
    ws.getCell(`G${partyRow}`).value = partyLabel;
    ws.getCell(`G${partyRow}`).font = { size: 8, bold: true, color: { argb: COLORS.mediumGray }, name: "Calibri" };
    ws.mergeCells(`G${partyRow}:K${partyRow}`);
    partyRow++;
    ws.getCell(`G${partyRow}`).value = data.party.name;
    ws.getCell(`G${partyRow}`).font = { size: 10, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
    ws.mergeCells(`G${partyRow}:K${partyRow}`);
    partyRow++;
    if (data.party.officialName && data.party.officialName !== data.party.name) {
      ws.getCell(`G${partyRow}`).value = data.party.officialName;
      ws.getCell(`G${partyRow}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
      ws.mergeCells(`G${partyRow}:K${partyRow}`);
      partyRow++;
    }
    if (data.party.address) {
      ws.getCell(`G${partyRow}`).value = data.party.address;
      ws.getCell(`G${partyRow}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
      ws.getCell(`G${partyRow}`).alignment = { wrapText: true, vertical: "top" };
      ws.mergeCells(`G${partyRow}:K${partyRow}`);
      ws.getRow(partyRow).height = 30;
      partyRow++;
    }
    if (data.party.attn) {
      ws.getCell(`G${partyRow}`).value = `Attn: ${data.party.attn}`;
      ws.getCell(`G${partyRow}`).font = { size: 9, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
      ws.mergeCells(`G${partyRow}:K${partyRow}`);
      partyRow++;
    }
    row = Math.max(row, partyRow);
  }

  row++;

  // ===================== REFERENCE INFO BAR =====================
  const refItems: string[] = [];
  if (data.reference) refItems.push(`Ref: ${data.reference}`);
  if (data.customerPoNo) refItems.push(`Client PO: ${data.customerPoNo}`);
  if (data.deliveryDate) refItems.push(`Delivery: ${data.deliveryDate}`);
  if (data.paymentTerms) refItems.push(`Payment: ${data.paymentTerms}`);
  if (data.incoterms) refItems.push(`Incoterms: ${data.incoterms}`);
  if (data.currency) refItems.push(`Currency: ${data.currency}`);

  if (refItems.length > 0) {
    ws.getCell(`A${row}`).value = refItems.join("   |   ");
    ws.getCell(`A${row}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
    ws.getCell(`A${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgLight } };
    ws.getCell(`A${row}`).alignment = { vertical: "middle", wrapText: true };
    ws.mergeCells(`A${row}:K${row}`);
    ws.getRow(row).height = 20;
    row += 2;
  }

  // ===================== ITEMS TABLE =====================
  const isDN = data.docType === "Delivery Note";
  const isReconciliation = data.docType === "Reconciliation";

  let headers: string[];
  if (isReconciliation) {
    headers = ["#", "Doc No", "Date", "Type", "Description", "", "Debit", "Credit", "", "", "Balance"];
  } else if (isDN) {
    headers = ["#", "Yarn", "Count", "Color", "Lot No", "Qty", "Packages", "Gross Wt", "Net Wt", "", "Remarks"];
  } else {
    headers = ["#", "Description", "Spec", "Color", "Reference", "Qty", "Unit Price", "Amount", "Weight", "Incoterms", "Remarks"];
  }

  // 表格標頭（黑底白字）
  const headerRow = ws.getRow(row++);
  headerRow.values = headers;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.black } };
    cell.font = { color: { argb: COLORS.white }, bold: true, size: 9, name: "Calibri" };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = BORDER_THIN;
  });
  headerRow.height = 22;

  // 資料列
  data.items.forEach((item, i) => {
    const dataRow = ws.getRow(row++);
    let vals: any[];

    if (isReconciliation) {
      vals = [
        i + 1,
        item.docNo || "",
        item.docDate || "",
        item.docType || "",
        item.description || "",
        "",
        item.debit !== undefined && item.debit > 0 ? item.debit.toFixed(2) : "",
        item.credit !== undefined && item.credit > 0 ? item.credit.toFixed(2) : "",
        "",
        "",
        item.balance !== undefined ? item.balance.toFixed(2) : "",
      ];
    } else if (isDN) {
      vals = [
        i + 1,
        item.yarnName || item.description || "",
        item.yarnCount || "",
        item.colorName || "",
        item.lotNo || "",
        item.quantity || "",
        item.packages || "",
        item.grossWeight || "",
        item.netWeight || "",
        "",
        item.notes || "",
      ];
    } else {
      vals = [
        i + 1,
        item.yarnName || item.description || "",
        item.yarnCount || item.composition || "",
        item.colorName || "",
        item.colorReference || item.colorCode || "",
        item.quantity || "",
        item.unitPrice ? item.unitPrice.toFixed(2) : "",
        item.amount ? item.amount.toFixed(2) : "",
        item.weightBasis || "",
        item.incoterms || "",
        item.notes || "",
      ];
    }

    dataRow.values = vals;
    dataRow.eachCell((cell, colNum) => {
      if (i % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgAlt } };
      }
      cell.font = { size: 9, color: { argb: COLORS.black }, name: "Calibri" };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = BORDER_THIN;

      // 文字對齊規則
      if (colNum === 1) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNum >= 6 && colNum <= 8) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.font = { size: 9, color: { argb: COLORS.black }, name: "Calibri" };
      } else if (colNum === 11) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }
    });
    dataRow.height = 20;
  });

  // ===================== TOTALS =====================
  if (!isDN && !isReconciliation && data.total !== undefined) {
    row++;
    const addTotalRow = (label: string, value: string, isGrand = false) => {
      const tr = ws.getRow(row++);
      tr.getCell(7).value = label;
      tr.getCell(8).value = value;
      tr.getCell(7).font = { size: isGrand ? 11 : 10, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
      tr.getCell(8).font = { size: isGrand ? 11 : 10, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
      tr.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
      tr.getCell(8).alignment = { horizontal: "right", vertical: "middle" };
      if (isGrand) {
        tr.getCell(7).border = { top: { style: "medium", color: { argb: COLORS.black } } };
        tr.getCell(8).border = { top: { style: "medium", color: { argb: COLORS.black } }, bottom: { style: "double", color: { argb: COLORS.black } } };
        tr.getCell(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgLight } };
        tr.getCell(8).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgLight } };
      }
      tr.height = isGrand ? 24 : 18;
    };

    if (data.subtotal !== undefined) {
      addTotalRow("Subtotal:", `${data.currency || ""} ${data.subtotal.toFixed(2)}`);
    }
    if (data.vatRate && data.vatAmount) {
      addTotalRow(`VAT (${data.vatRate}%):`, `${data.currency || ""} ${data.vatAmount.toFixed(2)}`);
    }
    addTotalRow("TOTAL:", `${data.currency || ""} ${data.total.toFixed(2)}`, true);
  }

  // Reconciliation 的期末餘額
  if (isReconciliation && data.closingBalance !== undefined) {
    row++;
    const balanceRow = ws.getRow(row++);
    balanceRow.getCell(7).value = "CLOSING BALANCE:";
    balanceRow.getCell(11).value = `${data.currency || ""} ${data.closingBalance.toFixed(2)}`;
    balanceRow.getCell(7).font = { size: 11, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
    balanceRow.getCell(11).font = { size: 11, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
    balanceRow.getCell(7).alignment = { horizontal: "right" };
    balanceRow.getCell(11).alignment = { horizontal: "right" };
    balanceRow.getCell(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgLight } };
    balanceRow.getCell(11).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgLight } };
    balanceRow.getCell(11).border = { top: { style: "medium", color: { argb: COLORS.black } }, bottom: { style: "double", color: { argb: COLORS.black } } };
    balanceRow.height = 24;
  }

  // ===================== BANK INFO =====================
  if (data.bankInfo) {
    row += 2;
    ws.getCell(`A${row}`).value = "BANK DETAILS";
    ws.getCell(`A${row}`).font = { size: 8, bold: true, color: { argb: COLORS.mediumGray }, name: "Calibri" };
    ws.mergeCells(`A${row}:K${row}`);
    row++;

    const bankLines = [
      `Beneficiary: ${data.bankInfo.accountName || data.company?.name || ""}`,
      `Bank: ${data.bankInfo.bankName}${data.bankInfo.branch ? ` - ${data.bankInfo.branch}` : ""}`,
      `A/C No: ${data.bankInfo.accountNumber || ""}`,
      data.bankInfo.swiftCode ? `SWIFT: ${data.bankInfo.swiftCode}` : "",
      data.bankInfo.iban ? `IBAN: ${data.bankInfo.iban}` : "",
      data.bankInfo.bankCode ? `Bank Code: ${data.bankInfo.bankCode}` : "",
    ].filter(Boolean);

    bankLines.forEach((line) => {
      const r = ws.getRow(row++);
      r.getCell(1).value = line;
      r.getCell(1).font = { size: 9, color: { argb: COLORS.black }, name: "Calibri" };
      ws.mergeCells(`A${row - 1}:K${row - 1}`);
    });
  }

  // ===================== REMARKS =====================
  if (data.notes) {
    row += 2;
    ws.getCell(`A${row}`).value = "REMARKS";
    ws.getCell(`A${row}`).font = { size: 8, bold: true, color: { argb: COLORS.mediumGray }, name: "Calibri" };
    ws.mergeCells(`A${row}:K${row}`);
    row++;

    ws.getCell(`A${row}`).value = data.notes;
    ws.getCell(`A${row}`).font = { size: 9, color: { argb: COLORS.black }, name: "Calibri" };
    ws.getCell(`A${row}`).alignment = { wrapText: true, vertical: "top" };
    ws.mergeCells(`A${row}:K${row}`);
    const noteLines = data.notes.split("\n").length;
    ws.getRow(row).height = Math.max(40, noteLines * 14);
    row++;
  }

  // ===================== SIGNATURES =====================
  row += 3;
  const sigRow = ws.getRow(row);
  sigRow.getCell(2).value = "_______________________";
  sigRow.getCell(8).value = "_______________________";
  sigRow.getCell(2).alignment = { horizontal: "center" };
  sigRow.getCell(8).alignment = { horizontal: "center" };
  row++;
  const sigLabelRow = ws.getRow(row);
  sigLabelRow.getCell(2).value = data.docType === "Purchase Order" || data.docType === "Supplier Invoice" ? "Authorized by" : "Authorized by";
  sigLabelRow.getCell(8).value = data.docType === "Purchase Order" || data.docType === "Supplier Invoice" ? "Supplier Confirmation" : "Client Confirmation";
  sigLabelRow.getCell(2).alignment = { horizontal: "center" };
  sigLabelRow.getCell(8).alignment = { horizontal: "center" };
  sigLabelRow.getCell(2).font = { size: 8, color: { argb: COLORS.mediumGray }, name: "Calibri" };
  sigLabelRow.getCell(8).font = { size: 8, color: { argb: COLORS.mediumGray }, name: "Calibri" };

  // ===================== FOOTER =====================
  row += 3;
  ws.getCell(`A${row}`).value = `Generated on ${new Date().toISOString().slice(0, 10)}  |  Fiborge Sales & Sourcing Hub`;
  ws.getCell(`A${row}`).font = { size: 7, color: { argb: COLORS.mediumGray }, name: "Calibri", italic: true };
  ws.getCell(`A${row}`).alignment = { horizontal: "center" };
  ws.mergeCells(`A${row}:K${row}`);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}