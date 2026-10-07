import ExcelJS from "exceljs";

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
  orderCategory?: string;
  quantityUnit?: string;
  items: ExportItem[];
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  total?: number;
  totalQuantity?: number;
  bankInfo?: { bankName: string; accountName?: string; accountNumber?: string; swiftCode?: string; iban?: string; branch?: string; bankCode?: string };
  notes?: string;
  periodFrom?: string;
  periodTo?: string;
  openingBalance?: number;
  closingBalance?: number;
  exportedBy?: string;
}

export async function generateExcel(data: ExportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Fiborge";
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

  ws.columns = [
    { width: 4 },   // A: #
    { width: 22 },  // B: Description
    { width: 16 },  // C: Spec (Count + Composition)
    { width: 14 },  // D: Color
    { width: 14 },  // E: Reference
    { width: 12 },  // F: Qty
    { width: 14 },  // G: Unit Price
    { width: 14 },  // H: Amount
    { width: 10 },  // I: Weight Basis
    { width: 16 },  // J: Remarks
  ];

  let row = 1;

  // ===================== LOGO =====================
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
    ws.addImage(logoImageId, { tl: { col: 0, row: 0 }, ext: { width: 110, height: 36 } });
  }

  // ===================== 🔧 優化 1: 公司名稱放大 + 地址電話直接跟隨 =====================
  ws.getRow(3).height = 22;
  ws.getCell("A3").value = data.company?.officialName || data.company?.name || "FIBORGE COMPANY LIMITED";
  ws.getCell("A3").font = { size: 14, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
  ws.mergeCells("A3:E3");

  let compRow = 4;
  if (data.company?.address) {
    ws.getCell(`A${compRow}`).value = data.company.address;
    ws.getCell(`A${compRow}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
    ws.getCell(`A${compRow}`).alignment = { wrapText: true, vertical: "top" };
    ws.mergeCells(`A${compRow}:E${compRow}`);
    ws.getRow(compRow).height = 28;
    compRow++;
  }
  if (data.company?.telephone) {
    ws.getCell(`A${compRow}`).value = `Tel: ${data.company.telephone}`;
    ws.getCell(`A${compRow}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
    ws.mergeCells(`A${compRow}:E${compRow}`);
    compRow++;
  }

  // ===================== 🔧 優化 4: 文件類型 + 編號 + 日期 (右上角) =====================
  ws.getCell("G1").value = data.docType.toUpperCase();
  ws.getCell("G1").font = { size: 14, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
  ws.getCell("G1").alignment = { horizontal: "right", vertical: "middle" };
  ws.mergeCells("G1:J2");

  // 🔧 Client PO 粗體顯示（最醒目）
  let rightRow = 3;
  if (data.customerPoNo) {
    ws.getCell(`G${rightRow}`).value = `Client PO: ${data.customerPoNo}`;
    ws.getCell(`G${rightRow}`).font = { size: 11, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
    ws.getCell(`G${rightRow}`).alignment = { horizontal: "right" };
    ws.mergeCells(`G${rightRow}:J${rightRow}`);
    rightRow++;
  }

  // 🔧 Internal PO No
  const internalLabel = data.docType === "Purchase Order" ? "PO No" : data.docType === "Quotation" ? "Quote No" : data.docType === "Delivery Note" ? "DN No" : data.docType === "Sales Invoice" ? "Invoice No" : "Doc No";
  ws.getCell(`G${rightRow}`).value = `${internalLabel}: ${data.docNo}`;
  ws.getCell(`G${rightRow}`).font = { size: 10, color: { argb: COLORS.darkGray }, name: "Calibri" };
  ws.getCell(`G${rightRow}`).alignment = { horizontal: "right" };
  ws.mergeCells(`G${rightRow}:J${rightRow}`);
  rightRow++;

  // 🔧 PO Date / Quote Date 等
  const dateLabel = data.docType === "Purchase Order" ? "PO Date" : data.docType === "Quotation" ? "Quote Date" : data.docType === "Delivery Note" ? "DN Date" : data.docType === "Sales Invoice" ? "Invoice Date" : "Date";
  ws.getCell(`G${rightRow}`).value = `${dateLabel}: ${data.date}`;
  ws.getCell(`G${rightRow}`).font = { size: 10, color: { argb: COLORS.darkGray }, name: "Calibri" };
  ws.getCell(`G${rightRow}`).alignment = { horizontal: "right" };
  ws.mergeCells(`G${rightRow}:J${rightRow}`);
  rightRow++;

  // 🔧 Delivery Date
  if (data.deliveryDate) {
    ws.getCell(`G${rightRow}`).value = `Delivery Date: ${data.deliveryDate}`;
    ws.getCell(`G${rightRow}`).font = { size: 10, color: { argb: COLORS.darkGray }, name: "Calibri" };
    ws.getCell(`G${rightRow}`).alignment = { horizontal: "right" };
    ws.mergeCells(`G${rightRow}:J${rightRow}`);
    rightRow++;
  }

  if (data.validUntil) {
    ws.getCell(`G${rightRow}`).value = `Valid Until: ${data.validUntil}`;
    ws.getCell(`G${rightRow}`).font = { size: 10, color: { argb: COLORS.darkGray }, name: "Calibri" };
    ws.getCell(`G${rightRow}`).alignment = { horizontal: "right" };
    ws.mergeCells(`G${rightRow}:J${rightRow}`);
    rightRow++;
  }

  row = Math.max(compRow, rightRow) + 1;

  // 分隔線
  for (let c = 1; c <= 10; c++) { ws.getCell(row, c).border = BORDER_BOTTOM; }
  row++;

  // ===================== 🔧 優化 2: TO (Supplier/Client) + Ship To =====================
  const infoStart = row;

  // TO
  const toLabel = data.docType === "Purchase Order" || data.docType === "Supplier Invoice" ? "TO (SUPPLIER)" : "TO (CLIENT)";
  if (data.party) {
    ws.getCell(`A${row}`).value = toLabel;
    ws.getCell(`A${row}`).font = { size: 8, bold: true, color: { argb: COLORS.mediumGray }, name: "Calibri" };
    ws.mergeCells(`A${row}:E${row}`);
    row++;
    ws.getCell(`A${row}`).value = data.party.name;
    ws.getCell(`A${row}`).font = { size: 10, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
    ws.mergeCells(`A${row}:E${row}`);
    row++;
    if (data.party.officialName && data.party.officialName !== data.party.name) {
      ws.getCell(`A${row}`).value = data.party.officialName;
      ws.getCell(`A${row}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
      ws.mergeCells(`A${row}:E${row}`);
      row++;
    }
    if (data.party.address) {
      ws.getCell(`A${row}`).value = data.party.address;
      ws.getCell(`A${row}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
      ws.getCell(`A${row}`).alignment = { wrapText: true, vertical: "top" };
      ws.mergeCells(`A${row}:E${row}`);
      ws.getRow(row).height = 28;
      row++;
    }
    if (data.party.attn) {
      ws.getCell(`A${row}`).value = `Attn: ${data.party.attn}`;
      ws.getCell(`A${row}`).font = { size: 9, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
      ws.mergeCells(`A${row}:E${row}`);
      row++;
    }
  }

  // 🔧 Ship To / Delivery To（右側）
  if (data.shipTo) {
    let shipRow = infoStart;
    ws.getCell(`G${shipRow}`).value = "SHIP TO";
    ws.getCell(`G${shipRow}`).font = { size: 8, bold: true, color: { argb: COLORS.mediumGray }, name: "Calibri" };
    ws.mergeCells(`G${shipRow}:J${shipRow}`);
    shipRow++;
    ws.getCell(`G${shipRow}`).value = data.shipTo.name;
    ws.getCell(`G${shipRow}`).font = { size: 10, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
    ws.mergeCells(`G${shipRow}:J${shipRow}`);
    shipRow++;
    if (data.shipTo.address) {
      ws.getCell(`G${shipRow}`).value = data.shipTo.address;
      ws.getCell(`G${shipRow}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
      ws.getCell(`G${shipRow}`).alignment = { wrapText: true, vertical: "top" };
      ws.mergeCells(`G${shipRow}:J${shipRow}`);
      ws.getRow(shipRow).height = 28;
      shipRow++;
    }
    row = Math.max(row, shipRow);
  }

  row += 1;

  // ===================== 🔧 優化 3: Reference Info Bar (加 Order Category, 去掉 Client PO 和 Delivery) =====================
  const refItems: string[] = [];
  if (data.reference) refItems.push(`Ref: ${data.reference}`);
  if (data.paymentTerms) refItems.push(`Payment: ${data.paymentTerms}`);
  if (data.incoterms) refItems.push(`Incoterms: ${data.incoterms}`);
  if (data.orderCategory && data.orderCategory !== "Bulk") refItems.push(`Category: ${data.orderCategory}`);
  if (data.currency) refItems.push(`Currency: ${data.currency}`);

  if (refItems.length > 0) {
    ws.getCell(`A${row}`).value = refItems.join("   |   ");
    ws.getCell(`A${row}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
    ws.getCell(`A${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgLight } };
    ws.getCell(`A${row}`).alignment = { vertical: "middle", wrapText: true };
    ws.mergeCells(`A${row}:J${row}`);
    ws.getRow(row).height = 20;
    row += 2;
  }

  // ===================== 🔧 優化 5: ITEMS TABLE =====================
  const isDN = data.docType === "Delivery Note";
  const isReconciliation = data.docType === "Reconciliation";

  // 計算統一的幣別和單位標示
  const mainCurrency = data.currency || data.items[0]?.currency || "USD";
  const mainUnit = data.quantityUnit || "KGS";

  let headers: string[];
  if (isReconciliation) {
    headers = ["#", "Doc No", "Date", "Type", "Description", "", "Debit", "Credit", "", "Balance"];
  } else if (isDN) {
    headers = ["#", "Yarn", "Count", "Color", "Lot No", `Qty (${mainUnit})`, "Packages", "Gross Wt", "Net Wt", "Remarks"];
  } else {
    // 🔧 直接在標頭顯示單位 (方案 A)
    headers = ["#", "Description", "Spec", "Color", "Reference", `Qty (${mainUnit})`, `Unit Price (${mainCurrency}/${mainUnit.replace(/S$/i, "")})`, `Amount (${mainCurrency})`, "Weight", "Remarks"];
  }

  const headerRow = ws.getRow(row++);
  headerRow.values = headers;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.black } };
    cell.font = { color: { argb: COLORS.white }, bold: true, size: 8, name: "Calibri" };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = BORDER_THIN;
  });
  headerRow.height = 26;

  let totalQty = 0;

  data.items.forEach((item, i) => {
    const dataRow = ws.getRow(row++);

    // 🔧 Spec = Count + Composition 合併顯示
    const spec = [item.yarnCount, item.composition].filter(Boolean).join("\n");
    const qty = parseFloat(item.quantity || "0") || 0;
    totalQty += qty;

    // 計算 amount
    const amount = item.amount || (qty * (item.unitPrice || 0));

    let vals: any[];
    if (isReconciliation) {
      vals = [i + 1, item.docNo || "", item.docDate || "", item.docType || "", item.description || "", "", item.debit && item.debit > 0 ? item.debit.toFixed(2) : "", item.credit && item.credit > 0 ? item.credit.toFixed(2) : "", "", item.balance !== undefined ? item.balance.toFixed(2) : ""];
    } else if (isDN) {
      vals = [i + 1, item.yarnName || item.description || "", item.yarnCount || "", item.colorName || "", item.lotNo || "", item.quantity || "", item.packages || "", item.grossWeight || "", item.netWeight || "", item.notes || ""];
    } else {
      // 🔧 Qty 和 Unit Price 只顯示數字（單位已在標頭）
      vals = [
        i + 1,
        item.yarnName || item.description || "",
        spec,
        [item.colorName, item.colorCode].filter(Boolean).join("\n"),
        item.colorReference || "",
        qty > 0 ? qty.toLocaleString(undefined, { minimumFractionDigits: 0 }) : "",
        item.unitPrice ? item.unitPrice.toFixed(2) : "",
        amount > 0 ? amount.toFixed(2) : "",
        item.weightBasis || "",
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

      if (colNum === 1) cell.alignment = { horizontal: "center", vertical: "middle" };
      if (colNum >= 6 && colNum <= 8) cell.alignment = { horizontal: "right", vertical: "middle" };
      if (colNum === 10) cell.alignment = { horizontal: "right", vertical: "middle" };
      // Spec 欄位稍微特殊處理
      if (colNum === 3) cell.alignment = { vertical: "middle", wrapText: true };
    });
    dataRow.height = spec.includes("\n") ? 28 : 20;
  });

  // ===================== 🔧 優化 6: TOTALS (含重量總計) =====================
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

    // 🔧 Total Qty（重量總計）
    if (totalQty > 0) {
      addTotalRow(`Total Qty:`, `${totalQty.toLocaleString(undefined, { minimumFractionDigits: 0 })} ${mainUnit}`);
    }
    if (data.subtotal !== undefined) {
      addTotalRow("Subtotal:", `${mainCurrency} ${data.subtotal.toFixed(2)}`);
    }
    if (data.vatRate && data.vatAmount) {
      addTotalRow(`VAT (${data.vatRate}%):`, `${mainCurrency} ${data.vatAmount.toFixed(2)}`);
    }
    addTotalRow("TOTAL:", `${mainCurrency} ${data.total.toFixed(2)}`, true);
  }

  // Reconciliation closing balance
  if (isReconciliation && data.closingBalance !== undefined) {
    row++;
    const balRow = ws.getRow(row++);
    balRow.getCell(7).value = "CLOSING BALANCE:";
    balRow.getCell(10).value = `${data.currency || ""} ${data.closingBalance.toFixed(2)}`;
    balRow.getCell(7).font = { size: 11, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
    balRow.getCell(10).font = { size: 11, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
    balRow.getCell(7).alignment = { horizontal: "right" };
    balRow.getCell(10).alignment = { horizontal: "right" };
    balRow.getCell(10).border = { top: { style: "medium", color: { argb: COLORS.black } }, bottom: { style: "double", color: { argb: COLORS.black } } };
    balRow.getCell(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgLight } };
    balRow.getCell(10).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgLight } };
    balRow.height = 24;
  }

  // ===================== BANK INFO =====================
  if (data.bankInfo) {
    row += 2;
    ws.getCell(`A${row}`).value = "BANK DETAILS";
    ws.getCell(`A${row}`).font = { size: 8, bold: true, color: { argb: COLORS.mediumGray }, name: "Calibri" };
    ws.mergeCells(`A${row}:J${row}`);
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
      ws.getCell(`A${row}`).value = line;
      ws.getCell(`A${row}`).font = { size: 9, color: { argb: COLORS.black }, name: "Calibri" };
      ws.mergeCells(`A${row}:J${row}`);
      row++;
    });
  }

  // ===================== REMARKS =====================
  if (data.notes) {
    row += 2;
    ws.getCell(`A${row}`).value = "REMARKS";
    ws.getCell(`A${row}`).font = { size: 8, bold: true, color: { argb: COLORS.mediumGray }, name: "Calibri" };
    ws.mergeCells(`A${row}:J${row}`);
    row++;
    ws.getCell(`A${row}`).value = data.notes;
    ws.getCell(`A${row}`).font = { size: 9, color: { argb: COLORS.black }, name: "Calibri" };
    ws.getCell(`A${row}`).alignment = { wrapText: true, vertical: "top" };
    ws.mergeCells(`A${row}:J${row}`);
    const noteLines = data.notes.split("\n").length;
    ws.getRow(row).height = Math.max(40, noteLines * 14);
    row++;
  }

  // ===================== 🔧 優化 8: SIGNATURES (帶公司名稱) =====================
  row += 3;

  // 左邊：我方（公司）
  const myCompanyName = data.company?.name || "Company";
  const otherPartyName = data.party?.name || (data.docType === "Purchase Order" ? "Supplier" : "Client");

  ws.getCell(`B${row}`).value = "_______________________";
  ws.getCell(`B${row}`).alignment = { horizontal: "center" };
  ws.getCell(`H${row}`).value = "_______________________";
  ws.getCell(`H${row}`).alignment = { horizontal: "center" };
  row++;

  ws.getCell(`B${row}`).value = "Authorized by";
  ws.getCell(`B${row}`).font = { size: 8, color: { argb: COLORS.mediumGray }, name: "Calibri" };
  ws.getCell(`B${row}`).alignment = { horizontal: "center" };
  ws.getCell(`H${row}`).value = "Confirmation";
  ws.getCell(`H${row}`).font = { size: 8, color: { argb: COLORS.mediumGray }, name: "Calibri" };
  ws.getCell(`H${row}`).alignment = { horizontal: "center" };
  row++;

  // 🔧 簽名下方帶出公司名
  ws.getCell(`B${row}`).value = myCompanyName;
  ws.getCell(`B${row}`).font = { size: 8, bold: true, color: { argb: COLORS.darkGray }, name: "Calibri" };
  ws.getCell(`B${row}`).alignment = { horizontal: "center" };
  ws.getCell(`H${row}`).value = otherPartyName;
  ws.getCell(`H${row}`).font = { size: 8, bold: true, color: { argb: COLORS.darkGray }, name: "Calibri" };
  ws.getCell(`H${row}`).alignment = { horizontal: "center" };

  // ===================== 🔧 優化 7: FOOTER (User + 精確到秒) =====================
  row += 3;
  const nowFormatted = new Date().toISOString().replace("T", " ").slice(0, 19);
  const exportedByText = data.exportedBy ? `by ${data.exportedBy}` : "";
  ws.getCell(`A${row}`).value = `Generated on ${nowFormatted} ${exportedByText}`.trim();
  ws.getCell(`A${row}`).font = { size: 7, color: { argb: COLORS.mediumGray }, name: "Calibri", italic: true };
  ws.getCell(`A${row}`).alignment = { horizontal: "center" };
  ws.mergeCells(`A${row}:J${row}`);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
