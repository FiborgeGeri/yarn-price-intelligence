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

export function IconLayers({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export function IconRefresh({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

export function IconDroplet({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
    </svg>
  );
}

export function IconBeaker({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M9 2v6.5L4 18a2 2 0 002 2h12a2 2 0 002-2L15 8.5V2" /><path d="M8 2h8" /><path d="M7.5 14h9" />
    </svg>
  );
}

export function IconClock({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function IconTruck({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

export function IconPackage({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

export function IconBarChart({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

export function IconMail({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22 6 12 13 2 6" />
    </svg>
  );
}

export function IconShoppingBag({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

export function IconReceipt({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
}

export function IconWallet({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <path d="M21 12V7H5a2 2 0 010-4h14v4" /><path d="M3 5v14a2 2 0 002 2h16v-5" /><path d="M18 12a2 2 0 000 4h4v-4z" />
    </svg>
  );
}

export function IconBuilding({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
    </svg>
  );
}

export function IconCreditCard({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

export function IconArrowLeftRight({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}

export function IconSliders({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

export function IconCalendar({ className = "w-5 h-5" }: P) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={d} strokeWidth={1.5} strokeLinecap={s} strokeLinejoin={s}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
