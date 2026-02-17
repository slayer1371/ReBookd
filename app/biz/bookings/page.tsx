"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BizBooking {
  id: string;
  status: string;
  paidAmount: number;
  platformFee: number;
  createdAt: string;
  cancellation: {
    id: string;
    discountPercent: number;
    discountedPrice: number;
    originalStartTime: string;
    originalEndTime: string;
    service: {
      name: string;
      originalPrice: string;
      durationMinutes: number;
      category: string;
    };
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  COMPLETED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  REFUNDED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function BizBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<BizBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;

    fetch("/api/bookings/business")
      .then((r) => {
        if (r.status === 404) { router.push("/biz/onboard"); return []; }
        return r.json();
      })
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status, router]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const totalRevenue = bookings.reduce((s, b) => s + Number(b.paidAmount) - Number(b.platformFee), 0);
  const upcoming = bookings.filter(
    (b) => b.status === "CONFIRMED" && new Date(b.cancellation.originalStartTime) > new Date()
  );
  const past = bookings.filter(
    (b) => b.status !== "CONFIRMED" || new Date(b.cancellation.originalStartTime) <= new Date()
  );

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className={`mx-auto max-w-3xl transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/biz/dashboard" className="mb-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Dashboard
            </Link>
            <h1 className="text-xl font-bold text-white">Bookings Received</h1>
            <p className="text-sm text-zinc-400">
              {bookings.length} booking{bookings.length !== 1 ? "s" : ""} · ${totalRevenue.toFixed(2)} revenue (after fees)
            </p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-16 text-center">
            <span className="text-5xl">📭</span>
            <p className="mt-4 text-sm text-zinc-400">No bookings yet</p>
            <p className="mt-1 text-xs text-zinc-600">Post cancellation deals to start receiving bookings</p>
            <Link href="/biz/cancellations/new" className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500">
              Post a deal
            </Link>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Upcoming ({upcoming.length})</h2>
                <div className="space-y-2">
                  {upcoming.map((b) => (
                    <BizBookingCard key={b.id} booking={b} />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Past ({past.length})</h2>
                <div className="space-y-2">
                  {past.map((b) => (
                    <BizBookingCard key={b.id} booking={b} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BizBookingCard({ booking }: { booking: BizBooking }) {
  const c = booking.cancellation;
  const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.CONFIRMED;
  const isPast = new Date(c.originalStartTime) <= new Date();
  const netRevenue = Number(booking.paidAmount) - Number(booking.platformFee);

  return (
    <div className={`rounded-xl border border-white/[0.06] bg-[#111113]/60 backdrop-blur-xl p-4 transition-all hover:border-white/[0.1] ${isPast ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-white">{c.service.name}</p>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyle}`}>
              {booking.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Booked by <span className="text-zinc-400">{booking.user.name || booking.user.email}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {formatDate(c.originalStartTime)}
            </span>
            <span>{c.service.durationMinutes} min</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-white">${netRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-600">-${Number(booking.platformFee).toFixed(2)} fee</p>
        </div>
      </div>
    </div>
  );
}
