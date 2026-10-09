"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface Props {
  value?: string | string[];
  onChange: (value: any) => void;
  folder?: string;
  accept?: string;
  label?: string;
  hint?: string;
  multiple?: boolean;
  maxImages?: number;
}

export default function ImageUploader({
  value,
  onChange,
  folder = "fiborge/images",
  accept = "image/png, image/jpeg, image/webp, image/svg+xml",
  label,
  hint,
  multiple = false,
  maxImages = 5,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUrl = Array.isArray(value) ? value[0] || "" : value || "";

  // 檔案轉 Base64 Data URL 備援
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          onChange(data.url);
          setLoading(false);
          return;
        }
      }

      // Base64 回退備援
      const base64Url = await readFileAsDataUrl(file);
      onChange(base64Url);
    } catch {
      try {
        const base64Url = await readFileAsDataUrl(file);
        onChange(base64Url);
      } catch {
        setError("Failed to process image.");
      }
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClear = () => {
    onChange("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {currentUrl ? (
        <div className="relative inline-flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl group">
          <img
            src={currentUrl}
            alt="Upload Preview"
            className="h-12 w-auto max-w-[160px] object-contain rounded bg-white p-1 border border-slate-100"
          />
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-700">Image Uploaded</span>
            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">Ready to save</span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="w-6 h-6 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-500 flex items-center justify-center transition-colors cursor-pointer ml-2"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="w-full py-3 px-4 border-2 border-dashed border-slate-200 hover:border-[#f1c6b2] bg-slate-50/50 hover:bg-[#fef7f3]/50 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-[#d97449] animate-spin" />
          ) : (
            <Upload className="w-4 h-4 text-slate-400 group-hover:text-[#d97449] transition-colors" />
          )}
          <span className="text-xs font-semibold text-slate-600 group-hover:text-[#d97449] transition-colors">
            {loading ? "Processing..." : "Click to upload image"}
          </span>
          <span className="text-[10px] text-slate-400">PNG, JPG, WEBP or SVG (Max 5MB)</span>
        </button>
      )}

      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}