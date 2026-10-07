/**
 * 根據國家代碼/名稱判斷文件應使用的語言
 */
export function detectDocumentLanguage(country?: string | null): "en" | "zh" {
  if (!country) return "en";
  const normalized = country.trim().toLowerCase();
  const chineseIndicators = [
    "china", "cn", "中國", "中国", "中華人民共和國", "中华人民共和国",
    "prc", "p.r.c", "p.r.china",
  ];
  if (chineseIndicators.some(ind => normalized.includes(ind))) {
    return "zh";
  }
  return "en";
}

/**
 * 根據語言取得對應的 Remarks Template Key
 */
export function getRemarksTemplateKey(docType: string, language: "en" | "zh"): string {
  const map: Record<string, string> = {
    quotation: "template_quotation_remarks",
    po: "template_po_remarks",
    dn: "template_dn_remarks",
    invoice: "template_invoice_remarks",
    "supplier-invoice": "template_supplier_invoice_remarks",
    reconciliation: "template_reconciliation_remarks",
  };
  const base = map[docType] || "template_po_remarks";
  return `${base}_${language}`;
}