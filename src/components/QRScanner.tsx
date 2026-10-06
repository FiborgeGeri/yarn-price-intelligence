"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertCircle } from "lucide-react";

interface Props {
  onScan: (type: string, id: number) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        setScanning(true);

        await scanner.start(
          { facingMode: "environment" }, // 使用後置鏡頭
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // 掃描成功！解析 QR Code 內容
            stopScanner();

            try {
              // 支援 URL 格式：/scan?type=so&id=15
              const url = new URL(decodedText);
              const type = url.searchParams.get("type");
              const id = url.searchParams.get("id");

              if (type && id) {
                onScan(type, Number(id));
              } else {
                setError("QR code format not recognized");
              }
            } catch {
              // 如果不是 URL，嘗試簡單格式：so:15
              const parts = decodedText.split(":");
              if (parts.length === 2) {
                onScan(parts[0].trim(), Number(parts[1].trim()));
              } else {
                setError("QR code format not recognized");
              }
            }
          },
          () => {} // 忽略掃描中的錯誤
        );
      } catch (err: any) {
        setError("Camera access denied or not available. " + err.message);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onScan, stopScanner]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-[#fef7f3]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#d97449]" />
            <span className="text-sm font-semibold text-slate-800">Scan QR Code</span>
          </div>
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="relative">
          <div id="qr-reader" className="w-full" />

          {scanning && (
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="px-3 py-1 bg-black/60 text-white text-xs rounded-full">
                Point camera at a Fiborge QR code
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border-t border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-xs text-red-700">{error}</span>
          </div>
        )}

        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
