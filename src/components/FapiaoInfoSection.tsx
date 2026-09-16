"use client";

interface FapiaoInfo {
  fapiaoCompanyName?: string | null;
  fapiaoTaxId?: string | null;
  fapiaoAddress?: string | null;
  fapiaoPhone?: string | null;
  fapiaoFax?: string | null;
  fapiaoBankName?: string | null;
  fapiaoBankAccount?: string | null;
  fapiaoContact?: string | null;
}

interface Props {
  values: FapiaoInfo;
  onChange: (field: keyof FapiaoInfo, value: string) => void;
  country?: string;
}

/**
 * China Fapiao (VAT invoice) information section.
 * Only shows when country is China / 中國 / 中国.
 */
export default function FapiaoInfoSection({ values, onChange, country }: Props) {
  const isChinaEntity = (() => {
    if (!country) return false;
    const c = country.trim().toLowerCase();
    return c === "china" || c === "中國" || c === "中国" || c === "cn" || c === "prc";
  })();

  if (!isChinaEntity) return null;

  const hasAnyData = Object.values(values).some((v) => v && String(v).trim() !== "");

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
          增值稅開票資料 (China VAT Invoice)
        </span>
        {hasAnyData && (
          <span className="text-[10px] text-emerald-600 font-medium">✓ Fapiao info filled</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">公司名稱 Company Name</label>
          <input
            type="text"
            value={values.fapiaoCompanyName || ""}
            onChange={(e) => onChange("fapiaoCompanyName", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="e.g. 东莞升丽针织有限公司"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">納稅人識別號 Tax ID</label>
          <input
            type="text"
            value={values.fapiaoTaxId || ""}
            onChange={(e) => onChange("fapiaoTaxId", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
            placeholder="e.g. 91441900617486581N"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">聯繫人 Contact</label>
          <input
            type="text"
            value={values.fapiaoContact || ""}
            onChange={(e) => onChange("fapiaoContact", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="e.g. 鐘艷玲"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">地址 Address</label>
          <textarea
            value={values.fapiaoAddress || ""}
            onChange={(e) => onChange("fapiaoAddress", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            rows={2}
            placeholder="e.g. 东莞市大朗镇蔡边村白云前工业区"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">電話 Phone</label>
          <input
            type="text"
            value={values.fapiaoPhone || ""}
            onChange={(e) => onChange("fapiaoPhone", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="e.g. 0769-83319807"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">傳真 Fax</label>
          <input
            type="text"
            value={values.fapiaoFax || ""}
            onChange={(e) => onChange("fapiaoFax", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="e.g. 0769-83192531"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">開戶行 Bank Name</label>
          <input
            type="text"
            value={values.fapiaoBankName || ""}
            onChange={(e) => onChange("fapiaoBankName", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="e.g. 中国银行东莞大朗支行营业部"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">帳號 Account No.</label>
          <input
            type="text"
            value={values.fapiaoBankAccount || ""}
            onChange={(e) => onChange("fapiaoBankAccount", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
            placeholder="e.g. 728957741156"
          />
        </div>
      </div>
    </div>
  );
}
