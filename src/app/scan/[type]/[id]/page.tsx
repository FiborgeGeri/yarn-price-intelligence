"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

/**
 * Smart Scan Route: /scan/[type]/[id]
 *
 * When someone scans a QR code, they land here. This page:
 * 1. Checks if user is logged in
 * 2. If NOT logged in → redirect to login page with return URL
 * 3. If logged in → redirect to the correct page + auto-open the entity detail
 *
 * This ensures QR codes cannot be scanned by outsiders — they must have
 * a valid login before seeing any data.
 */

interface Params {
  type: string;
  id: string;
}

// Map scan types to app pages (for redirect after login)
const PAGE_MAP: Record<string, string> = {
  yarn: "yarns",
  so: "sales-orders",
  po: "purchase-orders",
  invoice: "invoices",
  "supplier-invoice": "supplier-invoices",
  quotation: "quotations",
  dn: "delivery-notes",
};

const TYPE_LABEL: Record<string, string> = {
  yarn: "Yarn",
  so: "Sales Order",
  po: "Purchase Order",
  invoice: "Sales Invoice",
  "supplier-invoice": "Supplier Invoice",
  quotation: "Quotation",
  dn: "Delivery Note",
};

export default function ScanPage({ params }: { params: Promise<Params> }) {
  const router = useRouter();
  const { type, id } = use(params);
  const [status, setStatus] = useState<"checking" | "redirecting" | "invalid" | "no-auth">("checking");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const check = async () => {
      // Validate type
      if (!PAGE_MAP[type]) {
        setStatus("invalid");
        setErrorMessage(`Unknown QR code type: "${type}"`);
        return;
      }

      // Validate id
      const numericId = Number(id);
      if (!numericId || isNaN(numericId)) {
        setStatus("invalid");
        setErrorMessage(`Invalid entity ID: "${id}"`);
        return;
      }

      // Check auth by calling /api/auth/me
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          // Not logged in — save the scan URL and redirect to login
          setStatus("no-auth");
          const returnUrl = `/scan/${type}/${id}`;
          if (typeof window !== "undefined") {
            sessionStorage.setItem("scanReturnUrl", returnUrl);
            sessionStorage.setItem("scanTargetPage", PAGE_MAP[type]);
            sessionStorage.setItem("scanTargetId", String(numericId));
          }
          setTimeout(() => {
            router.push("/");
          }, 1500);
          return;
        }

        // Logged in — save target and redirect to main app
        setStatus("redirecting");
        if (typeof window !== "undefined") {
          sessionStorage.setItem("scanTargetPage", PAGE_MAP[type]);
          sessionStorage.setItem("scanTargetId", String(numericId));
        }
        setTimeout(() => {
          router.push("/");
        }, 800);
      } catch (err) {
        console.error("Scan auth check failed:", err);
        setStatus("no-auth");
        setTimeout(() => router.push("/"), 1500);
      }
    };

    check();
  }, [type, id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdf5ef] via-white to-[#f5ede4] p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
        {status === "checking" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#e5885d] border-t-transparent rounded-full animate-spin" />
            <h1 className="text-lg font-bold text-slate-900 mb-2">Verifying access...</h1>
            <p className="text-sm text-slate-500">
              Looking up {TYPE_LABEL[type] || type} #{id}
            </p>
          </>
        )}

        {status === "redirecting" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">Access granted</h1>
            <p className="text-sm text-slate-500">
              Opening {TYPE_LABEL[type] || type}...
            </p>
          </>
        )}

        {status === "no-auth" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">Login required</h1>
            <p className="text-sm text-slate-500 mb-4">
              You need to sign in first to view this {TYPE_LABEL[type] || type}.
            </p>
            <p className="text-xs text-slate-400">Redirecting to login page...</p>
          </>
        )}

        {status === "invalid" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">Invalid QR code</h1>
            <p className="text-sm text-slate-500 mb-4">{errorMessage}</p>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Back to app
            </button>
          </>
        )}
      </div>
    </div>
  );
}
