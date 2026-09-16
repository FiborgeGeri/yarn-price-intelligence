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
  defaultCompanyName?: string;
  defaultAddress?: string;
}

/**
 * China Fapiao (VAT invoice) information section.
 * Only shows when country is China / 中國 / 中国.
 */
export default function FapiaoInfoSection({
  values,
  onChange,
  country,
  defaultCompanyName,
  defaultAddress,
}: Props) {
  const isChinaEntity = (() => {
    if (!country) return false;
    const c = country.trim().toLowerCase();
    return c === "china" || c === "中國" || c === "中国" || c === "cn" || c === "prc";
  })();

  if (!isChinaEntity) return null;

  const hasAnyData = Object.values(values).some((v) => v && String(v).trim() !== "");

  // 檢查目前的公司名稱/地址是否與預設值相同
  const companyNameMatchesDefault = !!defaultCompanyName && values.fapiaoCompanyName === defaultCompanyName;
  const addressMatchesDefault = !!defaultAddress && values.fapiaoAddress === defaultAddress;

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
          增值稅開票資料 (China VAT Invoice)
        </span>
        {hasAnyData && (
          <span className="text-[10px] text-emerald-600 font-medium">✓ Info filled</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-600">
              公司名稱 Company Name
            </label>
            {defaultCompanyName && !companyNameMatchesDefault && (
              <button
                type="button"
                onClick={() => onChange("fapiaoCompanyName", defaultCompanyName)}
                className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-medium"
                title={`Use Official Name: ${defaultCompanyName}`}
              >
                ⟲ Use Official Name
              </button>
            )}
          </div>
          <input
            type="text"
            value={values.fapiaoCompanyName || ""}
            onChange={(e) => onChange("fapiaoCompanyName", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="公司完整登記名稱"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">納稅人識別號 Tax ID</label>
          <input
            type="text"
            value={values.fapiaoTaxId || ""}
            onChange={(e) => onChange("fapiaoTaxId", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
            placeholder="統一社會信用代碼 / 稅號"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">聯繫人 Contact</label>
          <input
            type="text"
            value={values.fapiaoContact || ""}
            onChange={(e) => onChange("fapiaoContact", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="開票聯繫人姓名"
          />
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-600">
              地址 Address
            </label>
            {defaultAddress && !addressMatchesDefault && (
              <button
                type="button"
                onClick={() => onChange("fapiaoAddress", defaultAddress)}
                className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-medium"
                title={`Use Local Address: ${defaultAddress}`}
              >
                ⟲ Use Local Address
              </button>
            )}
          </div>
          <textarea
            value={values.fapiaoAddress || ""}
            onChange={(e) => onChange("fapiaoAddress", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            rows={2}
            placeholder="公司登記地址"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">電話 Phone</label>
          <input
            type="text"
            value={values.fapiaoPhone || ""}
            onChange={(e) => onChange("fapiaoPhone", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="區號-電話號碼"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">傳真 Fax</label>
          <input
            type="text"
            value={values.fapiaoFax || ""}
            onChange={(e) => onChange("fapiaoFax", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="區號-傳真號碼"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">開戶行 Bank Name</label>
          <input
            type="text"
            value={values.fapiaoBankName || ""}
            onChange={(e) => onChange("fapiaoBankName", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="開戶銀行全稱（含支行）"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">帳號 Account No.</label>
          <input
            type="text"
            value={values.fapiaoBankAccount || ""}
            onChange={(e) => onChange("fapiaoBankAccount", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
            placeholder="銀行帳號"
          />
        </div>
      </div>

      {(defaultCompanyName || defaultAddress) && (
        <p className="text-[10px] text-slate-400 mt-2">
          Tip: Click <span className="text-blue-600 font-medium">⟲ Use Official Name / Use Local Address</span> to copy values from the main fields above.
        </p>
      )}
    </div>
  );
}
