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
  micron?: string;
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
  shipTo?: { name: string; officialName?: string; address?: string; attn?: string; telephone?: string };
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

function needsMicronColumn(items: ExportItem[]): boolean {
  const animalFibers = ["wool", "cashmere", "mohair", "alpaca", "angora", "camel", "yak", "merino", "lambswool", "shetland", "vicuna"];
  return items.some((it) => {
    const comp = (it.composition || "").toLowerCase();
    return animalFibers.some((f) => comp.includes(f));
  });
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

  const isDN = data.docType === "Delivery Note";
  const isReconciliation = data.docType === "Reconciliation";
  const showMicron = !isDN && !isReconciliation && needsMicronColumn(data.items);

  const mainCurrency = data.currency || data.items[0]?.currency || "USD";
  const mainUnit = data.quantityUnit || "KGS";
  const unitShort = mainUnit.replace(/S$/i, "");

  if (showMicron) {
    ws.columns = [
      { width: 4 }, { width: 14 }, { width: 28 }, { width: 8 },
      { width: 12 }, { width: 12 }, { width: 10 }, { width: 12 },
      { width: 12 }, { width: 7 }, { width: 14 },
    ];
  } else if (isDN) {
    ws.columns = [
      { width: 4 }, { width: 18 }, { width: 16 }, { width: 14 },
      { width: 12 }, { width: 10 }, { width: 10 }, { width: 10 },
      { width: 10 }, { width: 16 },
    ];
  } else {
    ws.columns = [
      { width: 4 }, { width: 14 }, { width: 28 }, { width: 12 },
      { width: 12 }, { width: 10 }, { width: 12 }, { width: 12 },
      { width: 7 }, { width: 14 },
    ];
  }

  const totalCols = showMicron ? 11 : 10;
  let row = 1;

  let logoImageId: number | null = null;
  if (data.company?.logoPath) {
    try {
      const logoUrl = toDirectImageUrl(data.company.logoPath);
      const logoResponse = await fetch(logoUrl, { redirect: "follow" });
      if (logoResponse.ok) {
        const logoBuffer = await logoResponse.arrayBuffer();
        const ext = logoUrl.includes(".png") ? "png" : "jpeg";
        logoImageId = wb.addImage({ buffer: logoBuffer as unknown as ExcelJS.Buffer, extension: ext as "png" | "jpeg" });
      }
    } catch (err) {}
  }
  if (logoImageId !== null) ws.addImage(logoImageId, { tl: { col: 0, row: 0 }, ext: { width: 110, height: 36 } });

  ws.getRow(3).height = 24;
  ws.getCell("A3").value = data.company?.officialName || data.company?.name || "FIBORGE COMPANY LIMITED";
  ws.getCell("A3").font = { size: 14, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
  ws.mergeCells(`A3:E3`);

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

  const rightStartCol = showMicron ? "H" : "G";
  const rightEndCol = showMicron ? "K" : "J";

  ws.getCell(`${rightStartCol}1`).value = data.docType.toUpperCase();
  ws.getCell(`${rightStartCol}1`).font = { size: 14, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
  ws.getCell(`${rightStartCol}1`).alignment = { horizontal: "right", vertical: "middle" };
  ws.mergeCells(`${rightStartCol}1:${rightEndCol}2`);

  let rightRow = 3;
  const setRight = (val: string, opts?: { bold?: boolean; size?: number }) => {
    ws.getCell(`${rightStartCol}${rightRow}`).value = val;
    ws.getCell(`${rightStartCol}${rightRow}`).font = { size: opts?.size || 10, bold: opts?.bold || false, color: { argb: COLORS.darkGray }, name: "Calibri" };
    ws.getCell(`${rightStartCol}${rightRow}`).alignment = { horizontal: "right" };
    ws.mergeCells(`${rightStartCol}${rightRow}:${rightEndCol}${rightRow}`);
    rightRow++;
  };

  if (data.customerPoNo) setRight(`Client PO: ${data.customerPoNo}`, { bold: true, size: 11 });

  const internalLabel = { "Purchase Order": "PO No", "Quotation": "Quote No", "Delivery Note": "DN No", "Sales Invoice": "Invoice No", "Supplier Invoice": "Supplier Inv No", "Reconciliation": "Rec No" }[data.docType] || "Doc No";
  setRight(`${internalLabel}: ${data.docNo}`);

  const dateLabel = { "Purchase Order": "PO Date", "Quotation": "Quote Date", "Delivery Note": "DN Date", "Sales Invoice": "Invoice Date", "Supplier Invoice": "Invoice Date", "Reconciliation": "Date" }[data.docType] || "Date";
  setRight(`${dateLabel}: ${data.date}`);

  if (data.deliveryDate) setRight(`Delivery Date: ${data.deliveryDate}`);
  if (data.validUntil) setRight(`Valid Until: ${data.validUntil}`);

  row = Math.max(compRow, rightRow) + 1;
  for (let c = 1; c <= totalCols; c++) ws.getCell(row, c).border = BORDER_BOTTOM;
  row++;

  const infoStart = row;

  // TO
  const toLabel = data.docType === "Purchase Order" || data.docType === "Supplier Invoice" ? "TO (SUPPLIER)" : "TO (CLIENT)";
  const partyFullName = data.party?.officialName || data.party?.name || "";
  if (data.party) {
    ws.getCell(`A${row}`).value = toLabel;
    ws.getCell(`A${row}`).font = { size: 8, bold: true, color: { argb: COLORS.mediumGray }, name: "Calibri" };
    ws.mergeCells(`A${row}:E${row}`);
    row++;
    ws.getCell(`A${row}`).value = partyFullName;
    ws.getCell(`A${row}`).font = { size: 10, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
    ws.mergeCells(`A${row}:E${row}`);
    row++;
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
    if (data.party.telephone) {
      ws.getCell(`A${row}`).value = `Tel: ${data.party.telephone}`;
      ws.getCell(`A${row}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
      ws.mergeCells(`A${row}:E${row}`);
      row++;
    }
  }

  // SHIP TO
  if (data.shipTo) {
    let shipRow = infoStart;
    ws.getCell(`${rightStartCol}${shipRow}`).value = "SHIP TO";
    ws.getCell(`${rightStartCol}${shipRow}`).font = { size: 8, bold: true, color: { argb: COLORS.mediumGray }, name: "Calibri" };
    ws.mergeCells(`${rightStartCol}${shipRow}:${rightEndCol}${shipRow}`);
    shipRow++;
    const shipToFullName = data.shipTo.officialName || data.shipTo.name;
    ws.getCell(`${rightStartCol}${shipRow}`).value = shipToFullName;
    ws.getCell(`${rightStartCol}${shipRow}`).font = { size: 10, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
    ws.mergeCells(`${rightStartCol}${shipRow}:${rightEndCol}${shipRow}`);
    shipRow++;
    if (data.shipTo.address) {
      ws.getCell(`${rightStartCol}${shipRow}`).value = data.shipTo.address;
      ws.getCell(`${rightStartCol}${shipRow}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
      ws.getCell(`${rightStartCol}${shipRow}`).alignment = { wrapText: true, vertical: "top" };
      ws.mergeCells(`${rightStartCol}${shipRow}:${rightEndCol}${shipRow}`);
      ws.getRow(shipRow).height = 28;
      shipRow++;
    }
    if (data.shipTo.attn) {
      ws.getCell(`${rightStartCol}${shipRow}`).value = `Attn: ${data.shipTo.attn}`;
      ws.getCell(`${rightStartCol}${shipRow}`).font = { size: 9, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
      ws.mergeCells(`${rightStartCol}${shipRow}:${rightEndCol}${shipRow}`);
      shipRow++;
    }
    if (data.shipTo.telephone) {
      ws.getCell(`${rightStartCol}${shipRow}`).value = `Tel: ${data.shipTo.telephone}`;
      ws.getCell(`${rightStartCol}${shipRow}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
      ws.mergeCells(`${rightStartCol}${shipRow}:${rightEndCol}${shipRow}`);
      shipRow++;
    }
    row = Math.max(row, shipRow);
  }

  row += 1;

  // ===================== 🔧 優化 3: Reference Info Bar (全新排序) =====================
  const refItems: string[] = [];
  if (data.reference) refItems.push(`Ref: ${data.reference}`);
  if (data.orderCategory && data.orderCategory !== "Bulk") refItems.push(`Category: ${data.orderCategory}`);
  if (data.currency) refItems.push(`Currency: ${data.currency}`);
  if (data.incoterms) refItems.push(`Incoterms: ${data.incoterms}`);
  if (data.paymentTerms) refItems.push(`Payment: ${data.paymentTerms}`);

  if (refItems.length > 0) {
    ws.getCell(`A${row}`).value = refItems.join("   |   ");
    ws.getCell(`A${row}`).font = { size: 9, color: { argb: COLORS.darkGray }, name: "Calibri" };
    ws.getCell(`A${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgLight } };
    ws.getCell(`A${row}`).alignment = { vertical: "middle", wrapText: true };
    ws.mergeCells(`A${row}:${String.fromCharCode(64 + totalCols)}${row}`);
    ws.getRow(row).height = 20;
    row += 2;
  }

  // ===================== ITEMS TABLE =====================
  const qtyHeader = `Qty (${mainUnit})`;
  const priceHeader = `Unit Price (${mainCurrency}/${unitShort})`;
  const amountHeader = `Amount (${mainCurrency})`;

  let headers: string[];
  if (isReconciliation) {
    headers = ["#", "Doc No", "Date", "Type", "Description", "", "Debit", "Credit", "", "Balance"];
  } else if (isDN) {
    headers = ["#", "Yarn", "Count", "Color", "Lot No", `Qty (${mainUnit})`, "Pkgs", "Gross Wt", "Net Wt", "Remarks"];
  } else if (showMicron) {
    headers = ["#", "Description", "Spec", "Micron", "Color", "Reference", qtyHeader, priceHeader, amountHeader, "Wt.", "Remarks"];
  } else {
    headers = ["#", "Description", "Spec", "Color", "Reference", qtyHeader, priceHeader, amountHeader, "Wt.", "Remarks"];
  }

  const headerRowExcel = ws.getRow(row++);
  headerRowExcel.values = headers;
  headerRowExcel.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.black } };
    cell.font = { color: { argb: COLORS.white }, bold: true, size: 8, name: "Calibri" };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = BORDER_THIN;
  });
  headerRowExcel.height = 26;

  const qtyColIdx = isDN ? 6 : isReconciliation ? 7 : (showMicron ? 7 : 6);
  const amountColIdx = isDN ? 0 : isReconciliation ? 0 : (showMicron ? 9 : 8);
  const balanceColIdx = isReconciliation ? 10 : 0;

  let totalQty = 0;

  data.items.forEach((item, i) => {
    const dataRow = ws.getRow(row++);
    const spec = [item.yarnCount, item.composition].filter(Boolean).join("\n");
    const qty = parseFloat(item.quantity || "0") || 0;
    totalQty += qty;
    const amount = item.amount || (qty * (item.unitPrice || 0));

    const colorDisplay = [item.colorName, item.colorCode].filter(Boolean).join("\n");
    const weightDisplay = item.weightBasis === "condition" ? "Cond." : item.weightBasis === "net" ? "Net" : (item.weightBasis || "");

    let vals: any[];
    if (isReconciliation) {
      vals = [i + 1, item.docNo || "", item.docDate || "", item.docType || "", item.description || "", "",
        item.debit && item.debit > 0 ? item.debit.toFixed(2) : "", item.credit && item.credit > 0 ? item.credit.toFixed(2) : "", "", item.balance !== undefined ? item.balance.toFixed(2) : ""];
    } else if (isDN) {
      vals = [i + 1, item.yarnName || item.description || "", item.yarnCount || "", item.colorName || "", item.lotNo || "", item.quantity || "", item.packages || "", item.grossWeight || "", item.netWeight || "", item.notes || ""];
    } else if (showMicron) {
      vals = [i + 1, item.yarnName || item.description || "", spec, item.micron || "", colorDisplay, item.colorReference || "",
        qty > 0 ? qty.toLocaleString(undefined, { minimumFractionDigits: 0 }) : "", item.unitPrice ? item.unitPrice.toFixed(2) : "", amount > 0 ? amount.toFixed(2) : "", weightDisplay, item.notes || ""];
    } else {
      vals = [i + 1, item.yarnName || item.description || "", spec, colorDisplay, item.colorReference || "",
        qty > 0 ? qty.toLocaleString(undefined, { minimumFractionDigits: 0 }) : "", item.unitPrice ? item.unitPrice.toFixed(2) : "", amount > 0 ? amount.toFixed(2) : "", weightDisplay, item.notes || ""];
    }

    dataRow.values = vals;
    dataRow.eachCell((cell, colNum) => {
      if (i % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgAlt } };
      cell.font = { size: 9, color: { argb: COLORS.black }, name: "Calibri" };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = BORDER_THIN;
      if (colNum === 1) cell.alignment = { horizontal: "center", vertical: "middle" };
      if (colNum >= qtyColIdx && colNum <= amountColIdx) cell.alignment = { horizontal: "right", vertical: "middle" };
      if (colNum === (showMicron ? 10 : 9)) cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    dataRow.height = spec.includes("\n") || colorDisplay.includes("\n") ? 28 : 20;
  });

  // TOTALS
  if (!isDN && !isReconciliation && data.total !== undefined) {
    row++;
    const totalRow = ws.getRow(row++);
    if (totalQty > 0) {
      totalRow.getCell(qtyColIdx).value = `${totalQty.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
      totalRow.getCell(qtyColIdx).font = { size: 10, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
      totalRow.getCell(qtyColIdx).alignment = { horizontal: "right", vertical: "middle" };
      totalRow.getCell(qtyColIdx).border = { top: { style: "medium", color: { argb: COLORS.black } }, bottom: { style: "double", color: { argb: COLORS.black } } };
      totalRow.getCell(qtyColIdx).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgLight } };
    }
    totalRow.getCell(amountColIdx - 1).value = "TOTAL:";
    totalRow.getCell(amountColIdx - 1).font = { size: 11, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
    totalRow.getCell(amountColIdx - 1).alignment = { horizontal: "right", vertical: "middle" };
    totalRow.getCell(amountColIdx).value = `${mainCurrency} ${data.total.toFixed(2)}`;
    totalRow.getCell(amountColIdx).font = { size: 11, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
    totalRow.getCell(amountColIdx).alignment = { horizontal: "right", vertical: "middle" };
    totalRow.getCell(amountColIdx).border = { top: { style: "medium", color: { argb: COLORS.black } }, bottom: { style: "double", color: { argb: COLORS.black } } };
    totalRow.getCell(amountColIdx).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgLight } };
    totalRow.height = 24;

    if (data.vatRate && data.vatAmount) {
      const vatRow = ws.getRow(row++);
      vatRow.getCell(amountColIdx - 1).value = `VAT (${data.vatRate}%):`;
      vatRow.getCell(amountColIdx - 1).font = { size: 10, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
      vatRow.getCell(amountColIdx - 1).alignment = { horizontal: "right" };
      vatRow.getCell(amountColIdx).value = `${mainCurrency} ${data.vatAmount.toFixed(2)}`;
      vatRow.getCell(amountColIdx).font = { size: 10, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
      vatRow.getCell(amountColIdx).alignment = { horizontal: "right" };
      vatRow.height = 20;
      const grandTotal = data.total + data.vatAmount;
      const grandRow = ws.getRow(row++);
      grandRow.getCell(amountColIdx - 1).value = "GRAND TOTAL:";
      grandRow.getCell(amountColIdx - 1).font = { size: 11, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
      grandRow.getCell(amountColIdx - 1).alignment = { horizontal: "right" };
      grandRow.getCell(amountColIdx).value = `${mainCurrency} ${grandTotal.toFixed(2)}`;
      grandRow.getCell(amountColIdx).font = { size: 11, bold: true, color: { argb: COLORS.black }, name: "Calibri" };
      grandRow.getCell(amountColIdx).alignment = { horizontal: "right" };
      grandRow.getCell(amountColIdx).border = { top: { style: "medium", color: { argb: COLORS.black } }, bottom: { style: "double", color: { argb: COLORS.black } } };
      grandRow.getCell(amountColIdx).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgLight } };
      grandRow.height = 24;
    }
  }

  // Reconciliation closing balance
  if (isReconciliation && data.closingBalance !== undefined) {
    row++;
    const balRow = ws.getRow(row++);
    balRow.getCell(balanceColIdx - 1).value = "CLOSING BALANCE:";
    balRow.getCell(balanceColIdx).value = `${data.currency || ""} ${data.closingBalance.toFixed(2)}`;
    balRow.getCell(balanceColIdx - 1).font = { size: 11, bold: true, name: "Calibri" };
    balRow.getCell(balanceColIdx).font = { size: 11, bold: true, name: "Calibri" };
    balRow.getCell(balanceColIdx - 1).alignment = { horizontal: "right" };
    balRow.getCell(balanceColIdx).alignment = { horizontal: "right" };
    balRow.getCell(balanceColIdx).border = { top: { style: "medium", color: { argb: COLORS.black } }, bottom: { style: "double", color: { argb: COLORS.black } } };
    balRow.getCell(balanceColIdx).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgLight } };
    balRow.height = 24;
  }

  // BANK INFO
  if (data.bankInfo) {
    row += 2;
    ws.getCell(`A${row}`).value = "BANK DETAILS";
    ws.getCell(`A${row}`).font = { size: 8, bold: true, color: { argb: COLORS.mediumGray }, name: "Calibri" };
    ws.mergeCells(`A${row}:${String.fromCharCode(64 + totalCols)}${row}`);
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
      ws.mergeCells(`A${row}:${String.fromCharCode(64 + totalCols)}${row}`);
      row++;
    });
  }

  // REMARKS
  if (data.notes) {
    row += 2;
    ws.getCell(`A${row}`).value = "REMARKS";
    ws.getCell(`A${row}`).font = { size: 8, bold: true, color: { argb: COLORS.mediumGray }, name: "Calibri" };
    ws.mergeCells(`A${row}:${String.fromCharCode(64 + totalCols)}${row}`);
    row++;
    ws.getCell(`A${row}`).value = data.notes;
    ws.getCell(`A${row}`).font = { size: 9, color: { argb: COLORS.black }, name: "Calibri" };
    ws.getCell(`A${row}`).alignment = { wrapText: true, vertical: "top" };
    ws.mergeCells(`A${row}:${String.fromCharCode(64 + totalCols)}${row}`);
    ws.getRow(row).height = Math.max(40, data.notes.split("\n").length * 14);
    row++;
  }

  // SIGNATURES
  row += 3;
  const myFullName = data.company?.officialName || data.company?.name || "Company";
  const otherFullName = data.party?.officialName || data.party?.name || "";
  const sigEndCol = showMicron ? 9 : 8;

  ws.getCell(`B${row}`).value = "_______________________";
  ws.getCell(`B${row}`).alignment = { horizontal: "center" };
  ws.getCell(row, sigEndCol).value = "_______________________";
  ws.getCell(row, sigEndCol).alignment = { horizontal: "center" };
  row++;
  ws.getCell(`B${row}`).value = "Authorized by";
  ws.getCell(`B${row}`).font = { size: 8, color: { argb: COLORS.mediumGray }, name: "Calibri" };
  ws.getCell(`B${row}`).alignment = { horizontal: "center" };
  ws.getCell(row, sigEndCol).value = "Confirmation";
  ws.getCell(row, sigEndCol).font = { size: 8, color: { argb: COLORS.mediumGray }, name: "Calibri" };
  ws.getCell(row, sigEndCol).alignment = { horizontal: "center" };
  row++;
  ws.getCell(`B${row}`).value = myFullName;
  ws.getCell(`B${row}`).font = { size: 8, bold: true, color: { argb: COLORS.darkGray }, name: "Calibri" };
  ws.getCell(`B${row}`).alignment = { horizontal: "center" };
  ws.getCell(row, sigEndCol).value = otherFullName;
  ws.getCell(row, sigEndCol).font = { size: 8, bold: true, color: { argb: COLORS.darkGray }, name: "Calibri" };
  ws.getCell(row, sigEndCol).alignment = { horizontal: "center" };

  // FOOTER (時間精確到秒，BY 登入用戶 Display Name)
  row += 3;
  const nowFormatted = new Date().toISOString().replace("T", " ").slice(0, 19);
  const byUser = data.exportedBy ? ` by ${data.exportedBy}` : "";
  ws.getCell(`A${row}`).value = `Generated on ${nowFormatted}${byUser}`;
  ws.getCell(`A${row}`).font = { size: 7, color: { argb: COLORS.mediumGray }, name: "Calibri", italic: true };
  ws.getCell(`A${row}`).alignment = { horizontal: "center" };
  ws.mergeCells(`A${row}:${String.fromCharCode(64 + totalCols)}${row}`);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}