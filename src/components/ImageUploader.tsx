"use client";

import { useState, useRef, useMemo } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface Props {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  folder?: string;
  multiple?: boolean;
  maxImages?: number;
  label?: string;
  hint?: string;
}

export default function ImageUploader({
  value,
  onChange,
  folder = "yarns",
  multiple = false,
  maxImages = 5,
  label,
  hint,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse value into a reliable array of image URLs
  const images: string[] = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : (value ? [value as string] : []);
    }
    return value ? [value as string] : [];
  }, [value, multiple]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Upload failed");
        }
        const data = await res.json();
        newUrls.push(data.url);
      }

      if (multiple) {
        const combined = [...images, ...newUrls].slice(0, maxImages);
        onChange(combined);
      } else {
        onChange(newUrls[0]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    if (multiple) {
      onChange(images.filter((_, i) => i !== index));
    } else {
      onChange("");
    }
  };

  const canAddMore = multiple ? images.length < maxImages : images.length === 0;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </label>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((url, index) => (
          <div 
            key={index} 
            className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-sm"
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-[10px] font-medium">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="text-[10px] font-medium">Add Image</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <p className="text-[10px] text-slate-400">
        {hint || `JPG, PNG, WebP or GIF (max 10MB per image)${multiple ? `. Up to ${maxImages} images.` : "."}`}
      </p>
    </div>
  );
}
