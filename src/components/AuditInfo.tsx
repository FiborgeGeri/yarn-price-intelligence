"use client";

interface AuditInfoProps {
  createdByName?: string | null;
  updatedByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  className?: string;
}

export default function AuditInfo({ createdByName, updatedByName, createdAt, updatedAt, className = "" }: AuditInfoProps) {
  if (!createdByName && !updatedByName) return null;

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return ""; }
  };

  return (
    <div className={`text-[10px] text-slate-400 ${className}`}>
      {createdByName && (
        <span>Created by <span className="text-slate-500">{createdByName}</span>{createdAt ? ` on ${formatDate(createdAt)}` : ""}</span>
      )}
      {updatedByName && updatedByName !== createdByName && (
        <span>{createdByName ? " · " : ""}Edited by <span className="text-slate-500">{updatedByName}</span>{updatedAt ? ` on ${formatDate(updatedAt)}` : ""}</span>
      )}
      {updatedByName && updatedByName === createdByName && updatedAt && createdAt && updatedAt !== createdAt && (
        <span> · Edited {formatDate(updatedAt)}</span>
      )}
    </div>
  );
}
