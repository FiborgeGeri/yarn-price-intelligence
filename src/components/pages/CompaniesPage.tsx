"use client";

import { useState, useEffect } from "react";
import { Permissions } from "@/lib/permissions";
import { getUserId } from "@/lib/getUserId";

interface Badge {
  label: string;
  tone: "coral" | "sage" | "neutral";
}

export interface DirectoryCardProps {
  name: string;
  officialName?: string | null;
  badge?: Badge | null;
  addressEnglish?: string | null;
  addressLocal?: string | null;
  country?: string | null;
  telephone?: string | null;
  summary?: string | null;
  chips?: string[];
  notes?: string | null;
  contactCount: number;
  createdByName?: string | null;
  updatedByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  permissions: Permissions;
  onContacts?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onManageBanks?: () => void; // 🆕 接收銀行管理功能
}

export function DirectoryCard({
  name,
  officialName,
  badge,
  addressEnglish,
  addressLocal,
  country,
  telephone,
  summary,
  chips,
  notes,
  contactCount,
  createdByName,
  updatedByName,
  createdAt,
  updatedAt,
  permissions,
  onContacts,
  onEdit,
  onDelete,
  onView,
  onManageBanks,
}: DirectoryCardProps) {
  const badgeStyle = {
    coral: "bg-[#fdeae2] text-[#b7492f] border border-[#f4c9b6]",
    sage: "bg-[#f0f5ee] text-[#4d7d41] border border-[#c2d9b8]",
    neutral: "bg-slate-100 text-slate-600 border border-slate-200",
  };

  return (
    <div
      onClick={onView}
      className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 leading-tight mb-1">{name}</h3>
          {officialName && <p className="text-[11px] text-slate-500 max-w-[280px] truncate">{officialName}</p>}
        </div>
        {badge && (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeStyle[badge.tone]}`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-2 mb-4">
        <div className="text-xs text-slate-600">
          {(addressLocal || addressEnglish) && (
            <div className="flex gap-2">
              <span className="text-slate-400 w-16 shrink-0">Address:</span>
              <span className="truncate">{addressLocal || addressEnglish}</span>
            </div>
          )}
          {country && (
            <div className="flex gap-2 mt-1.5">
              <span className="text-slate-400 w-16 shrink-0">Country:</span>
              <span>{country}</span>
            </div>
          )}
          {telephone && (
            <div className="flex gap-2 mt-1.5">
              <span className="text-slate-400 w-16 shrink-0">Tel:</span>
              <span>{telephone}</span>
            </div>
          )}
        </div>

        {summary && <div className="text-xs font-semibold text-slate-700 mt-2">{summary}</div>}

        {chips && chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {chips.map((c, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {notes && (
        <div className="text-[11px] text-slate-500 mb-4 p-2 bg-slate-50 rounded-lg italic line-clamp-2">
          {notes}
        </div>
      )}

      {/* 底部按鈕區 */}
      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onContacts) onContacts();
          }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          {contactCount} Contact{contactCount === 1 ? "" : "s"}
        </button>
        
        <div className="flex items-center gap-4">
          {/* 🆕 銀行帳戶管理按鈕 - 純文字極簡風格 */}
          {permissions.canEdit && onManageBanks && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onManageBanks();
              }}
              className="text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
            >
              Bank Accounts
            </button>
          )}
          {permissions.canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); if (onEdit) onEdit(); }}
              className="text-xs font-semibold text-[#d97449] hover:text-[#b7492f] transition-colors"
            >
              Edit
            </button>
          )}
          {permissions.canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); if (onDelete) onDelete(); }}
              className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
            >
              Del
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ... 保持後方 DirectoryContactsModal 的代碼不變 ...
export function DirectoryContactsModal({ entity, endpoint, foreignKey, permissions, emptyText, onClose, onChanged }: any) {
  // ... (保留原本 Modal 的代碼，無需修改) ...
  return null; // 此處省略，僅提供更新卡片的參考
}
