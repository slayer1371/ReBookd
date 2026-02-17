"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import ReviewModal from "@/components/ReviewModal";

interface Booking {
  id: string;
  status: string;
  paidAmount: number;
  platformFee: number;
  createdAt: string;
  review?: {
    id: string;
    rating: number;
  } | null;
  cancellation: {
    id: string;
    discountPercent: number;
    originalStartTime: string;
    originalEndTime: string;
    service: {
      name: string;
      originalPrice: string;
      durationMinutes: number;
      category: string;
    };
    business: {
      id: string;
      name: string;
      slug: string;
      category: string;
      address: string;
      city: string;
      logoUrl?: string | null;
    };
  };
}

const CATEGORY_META: Record<string, { icon: string }> = {
  FITNESS: { icon: "💪" }, YOGA: { icon: "🧘" }, SALON: { icon: "💇" },
  BARBERSHOP: { icon: "✂️" }, SPA: { icon: "🧖" }, MASSAGE: { icon: "💆" },
  DENTAL: { icon: "🦷" }, MEDICAL: { icon: "🏥" }, PHYSIOTHERAPY: { icon: "🏋️" },
  MENTAL_HEALTH: { icon: "🧠" }, RESTAURANT: { icon: "🍽️" }, OTHER: { icon: "📋" },
};

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

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchBookings = () => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;
    fetchBookings();
  }, [status, router]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const upcoming = bookings.filter(
    (b) => b.status === "CONFIRMED" && new Date(b.cancellation.originalStartTime) > new Date()
  );
  const past = bookings.filter(
    (b) => b.status !== "CONFIRMED" || new Date(b.cancellation.originalStartTime) <= new Date()
  );

  return (
    <div className="relative min-h-screen bg-[#0a0a0b]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-indigo-600/8 blur-[140px]" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-purple-600/8 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-8">
        <div className={`transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <h1 className="text-2xl font-bold text-white">My Bookings</h1>
          <p className="mt-1 text-sm text-zinc-500">{bookings.length} total booking{bookings.length !== 1 ? "s" : ""}</p>

          {bookings.length === 0 ? (
            <div className="mt-12 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-16 text-center">
              <span className="text-5xl">📭</span>
              <p className="mt-4 text-sm text-zinc-400">No bookings yet</p>
              <p className="mt-1 text-xs text-zinc-600">Browse deals and book your first discounted appointment</p>
              <Link href="/" className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                Browse deals
              </Link>
            </div>
          ) : (
            <>
              {/* Upcoming */}
              {upcoming.length > 0 && (
                <div className="mt-6">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Upcoming</h2>
                  <div className="space-y-2">
                    {upcoming.map((b) => (
                      <BookingCard key={b.id} booking={b} onUpdate={fetchBookings} />
                    ))}
                  </div>
                </div>
              )}

              {/* Past */}
              {past.length > 0 && (
                <div className="mt-8">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Past</h2>
                  <div className="space-y-2">
                    {past.map((b) => (
                      <BookingCard key={b.id} booking={b} onUpdate={fetchBookings} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, onUpdate }: { booking: Booking; onUpdate: () => void }) {
  const c = booking.cancellation;
  const icon = CATEGORY_META[c.business.category]?.icon || "📋";
  const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.CONFIRMED;
  const isPast = new Date(c.originalStartTime) <= new Date();
  const canReview = booking.status === "COMPLETED" && !booking.review;

  return (
    <div className={`relative rounded-xl border border-white/[0.06] bg-[#111113]/60 backdrop-blur-xl p-4 transition-all hover:border-white/[0.1] ${isPast ? "opacity-90" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-xl">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-white">{c.service.name}</p>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyle}`}>
              {booking.status}
            </span>
            {booking.review && (
              <span className="flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-500">
                ★ {booking.review.rating}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">
            <Link href={`/b/${c.business.slug}`} className="hover:text-indigo-400 hover:underline">
              {c.business.name}
            </Link>{" "}
            · {c.business.address}, {c.business.city}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {formatDate(c.originalStartTime)}
            </span>
            <span>{c.service.durationMinutes} min</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">${Number(booking.paidAmount).toFixed(2)}</p>
            <p className="text-[10px] text-emerald-400">-{c.discountPercent}%</p>
          </div>
          {canReview && (
            <ReviewModal
              bookingId={booking.id}
              businessName={c.business.name}
              serviceName={c.service.name}
              image={c.business.logoUrl || null}
              onReviewSubmitted={onUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
