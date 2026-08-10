interface P {
  className?: string;
}

const d = "currentColor";
const s = "round";

export function IconDashboard({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

export function IconPlus({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconClipboard({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" />
    </svg>
  );
}

export function IconScale({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M12 3v18M3 9l3-6 3 6M15 9l3-6 3 6M3 9h6M15 9h6" />
    </svg>
  );
}

export function IconTrendUp({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

export function IconMicroscope({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <circle cx="12" cy="9" r="3" /><path d="M12 12v4" /><path d="M8 21h8" /><path d="M12 16v5" /><path d="M10 5V3h4v2" />
    </svg>
  );
}

export function IconYarn({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <circle cx="12" cy="12" r="9" /><path d="M12 3c-3 4-3 14 0 18" /><path d="M12 3c3 4 3 14 0 18" /><path d="M3 12h18" />
    </svg>
  );
}

export function IconFactory({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M2 20h20" /><path d="M6 20V10l4 3V10l4 3V4h6v16" /><rect x="16" y="8" width="2" height="2" /><rect x="16" y="13" width="2" height="2" />
    </svg>
  );
}

export function IconCertificate({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M4 4h16v12H4z" /><path d="M8 8h8M8 11h5" /><circle cx="12" cy="20" r="2" /><path d="M10 18l-2 3M14 18l2 3" />
    </svg>
  );
}

export function IconFlask({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M9 3h6M10 3v7l-5 8a1 1 0 00.85 1.53h12.3A1 1 0 0019 18l-5-8V3" />
    </svg>
  );
}

export function IconSettings({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" />
    </svg>
  );
}

export function IconSearch({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function IconDollar({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

export function IconStar({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function IconLock({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

export function IconX({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function IconTrash({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

export function IconUpload({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function IconLogout({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function IconEye({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEyeOff({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function IconMenu({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function IconBell({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

export function IconDownload({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function IconChevronDown({ className = "w-4 h-4" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function IconCheck({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={2} strokeLinecap={s} strokeLinejoin={s}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconUsers({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

export function IconFileText({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function IconPercent({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

export function IconMapPin({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function IconShoppingCart({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
}
