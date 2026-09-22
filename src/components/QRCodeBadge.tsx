"use client";

import { QRCodeSVG } from "qrcode.react";
import { useMemo, useRef } from "react";
import { Download } from "lucide-react";

interface Props {
  type: "yarn" | "so" | "po" | "invoice" | "quotation" | "dn" | "supplier-invoice";
  id: number;
  size?: number;
  label?: string;
  reference?: string;
  bordered?: boolean;
  className?: string;
}

export default function QRCodeBadge({
  type,
  id,
  size = 96,
  label,
  reference,
  bordered = true,
  className = "",
}: Props) {
  const svgRef = useRef<HTMLDivElement>(null);

  const scanUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    return `${origin}/scan/${type}/${id}`;
  }, [type, id]);

  const handleDownload = () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current.querySelector("svg");
    if (!svgEl) return;

    // 將 SVG 轉為高解析度 PNG（4x 放大，適合列印）
    const scale = 4;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    canvas.width = size * scale;
    canvas.height = size * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `QR-${type}-${id}${reference ? `-${reference.replace(/[^a-zA-Z0-9]/g, "")}` : ""}.png`;
      link.href = pngUrl;
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (!scanUrl) return null;

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
      <div ref={svgRef}>
        <QRCodeSVG
          value={scanUrl}
          size={size}
          level="M"
          marginSize={1}
          bgColor="#ffffff"
          fgColor="#1e293b"
        />
      </div>
      {reference && (
        <div className="text-[10px] font-mono font-medium text-slate-600 mt-1 max-w-[120px] text-center truncate">
          {reference}
        </div>
      )}
      <button
        type="button"
        onClick={handleDownload}
        className="mt-1 flex items-center gap-1 text-[9px] text-blue-600 hover:text-blue-800 hover:underline font-medium"
      >
        <Download className="w-3 h-3" />
        Download PNG
      </button>
    </div>
  );
}
