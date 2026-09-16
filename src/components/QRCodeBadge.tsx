"use client";

import { QRCodeSVG } from "qrcode.react";
import { useMemo } from "react";

interface Props {
  /** Entity type — used to build the /scan URL */
  type: "yarn" | "so" | "po" | "invoice" | "quotation" | "dn" | "supplier-invoice";
  /** Entity ID */
  id: number;
  /** QR code size in pixels (default: 96) */
  size?: number;
  /** Optional label to show above the QR code */
  label?: string;
  /** Optional reference number to show below the QR code */
  reference?: string;
  /** Show a bordered card (default: true). Set false for embedded/inline use. */
  bordered?: boolean;
  /** Additional class name for the outer container */
  className?: string;
}

/**
 * QR Code Badge — generates a scannable QR code that links to a login-protected
 * /scan/[type]/[id] route. Scanners must be logged in to view the entity data.
 *
 * Usage:
 * <QRCodeBadge type="yarn" id={123} label="Yarn" reference="MERINO-01" />
 */
export default function QRCodeBadge({
  type,
  id,
  size = 96,
  label,
  reference,
  bordered = true,
  className = "",
}: Props) {
  const scanUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    return `${origin}/scan/${type}/${id}`;
  }, [type, id]);

  if (!scanUrl) {
    // SSR fallback (won't render QR on server)
    return null;
  }

  const container = bordered
    ? "inline-flex flex-col items-center p-2 bg-white border border-slate-200 rounded-lg shadow-sm"
    : "inline-flex flex-col items-center";

  return (
    <div className={`${container} ${className}`}>
      {label && (
        <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
          {label}
        </div>
      )}
      <QRCodeSVG
        value={scanUrl}
        size={size}
        level="M"
        marginSize={1}
        bgColor="#ffffff"
        fgColor="#1e293b"
      />
      {reference && (
        <div className="text-[10px] font-mono font-medium text-slate-600 mt-1 max-w-[120px] text-center truncate">
          {reference}
        </div>
      )}
      <div className="text-[8px] text-slate-400 mt-0.5">Scan to view</div>
    </div>
  );
}
