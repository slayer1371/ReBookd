"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface DealDetail {
  id: string;
  discountPercent: number;
  discountedPrice: number;
  originalStartTime: string;
  originalEndTime: string;
  status: string;
  minDiscount: number;
  maxDiscount: number;
  service: {
    id: string;
    name: string;
    originalPrice: string;
    durationMinutes: number;
    category: string;
    description: string | null;
  };
  business: {
    id: string;
    name: string;
    slug: string;
    category: string;
    address: string;
    city: string;
    state: string;
    lat: number;
    lng: number;
    avgRating: number;
    phone: string | null;
    logoUrl: string | null;
  };
}

const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  FITNESS: { icon: "💪", label: "Fitness" },
  YOGA: { icon: "🧘", label: "Yoga" },
  SALON: { icon: "💇", label: "Salon" },
  BARBERSHOP: { icon: "✂️", label: "Barbershop" },
  SPA: { icon: "🧖", label: "Spa" },
  MASSAGE: { icon: "💆", label: "Massage" },
  DENTAL: { icon: "🦷", label: "Dental" },
  MEDICAL: { icon: "🏥", label: "Medical" },
  PHYSIOTHERAPY: { icon: "🏋️", label: "Physio" },
  MENTAL_HEALTH: { icon: "🧠", label: "Mental Health" },
  RESTAURANT: { icon: "🍽️", label: "Restaurant" },
  OTHER: { icon: "📋", label: "Other" },
};

function timeUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function urgencyLevel(dateStr: string) {
  const hours = (new Date(dateStr).getTime() - Date.now()) / 3600000;
  if (hours <= 1) return { label: "🔥 Ending very soon", color: "text-red-400 bg-red-500/10 border-red-500/20" };
  if (hours <= 3) return { label: "⚡ Ending soon", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" };
  if (hours <= 6) return { label: "⏰ A few hours left", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  return { label: "✅ Plenty of time", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
}

// ─── Payment Form (uses Stripe Elements) ─────────────────────────────────
function PaymentForm({
  deal,
  onSuccess,
  onCancel,
}: {
  deal: DealDetail;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError("");

    try {
      // Step 1: Create PaymentIntent on server
      const intentRes = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancellationId: deal.id }),
      });

      if (!intentRes.ok) {
        const data = await intentRes.json();
        setError(data.error || "Failed to create payment");
        setProcessing(false);
        return;
      }

      const { clientSecret, paymentIntentId } = await intentRes.json();

      // Step 2: Confirm payment with Stripe
      const card = elements.getElement(CardElement);
      if (!card) {
        setError("Card element not found");
        setProcessing(false);
        return;
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: { card } }
      );

      if (stripeError) {
        setError(stripeError.message || "Payment failed");
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // Step 3: Create booking with paymentIntentId
        const bookRes = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cancellationId: deal.id,
            paymentIntentId,
          }),
        });

        if (!bookRes.ok) {
          const data = await bookRes.json();
          setError(data.error || "Booking failed after payment");
          setProcessing(false);
          return;
        }

        onSuccess();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
          Card Details
        </label>
        <div className="rounded-lg border border-white/[0.1] bg-[#0a0a0b] px-4 py-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "15px",
                  color: "#e4e4e7",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  "::placeholder": { color: "#52525b" },
                },
                invalid: { color: "#f87171" },
              },
            }}
          />
        </div>
        <p className="mt-2 text-[11px] text-zinc-600">
          🔒 Secured by Stripe. Use card 4242 4242 4242 4242 for testing.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.06] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={processing || !stripe}
          className="group relative flex-[2] overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/25 transition-all hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="relative flex items-center justify-center gap-2">
            {processing ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Processing...
              </>
            ) : (
              <>💳 Pay ${Number(deal.discountedPrice).toFixed(2)}</>
            )}
          </span>
        </button>
      </div>
    </form>
  );
}

// ─── Main Deal Page ──────────────────────────────────────────────────────
export default function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [watching, setWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch(`/api/cancellations/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setDeal)
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [id, router]);

  // Check watchlist status
  useEffect(() => {
    if (!deal || !session) return;
    fetch(`/api/watchlist/${deal.business.id}`)
      .then((r) => r.json())
      .then((d) => setWatching(d.watching))
      .catch(() => {});
  }, [deal, session]);

  const handleBookClick = () => {
    if (!session) {
      router.push("/login");
      return;
    }
    setError("");
    if (stripePromise) {
      // Stripe is configured — show payment form
      setShowPayment(true);
    } else {
      // No Stripe key — direct booking (free/test mode)
      handleDirectBook();
    }
  };

  const handleDirectBook = async () => {
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancellationId: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Booking failed");
        return;
      }
      setBooked(true);
    } catch {
      setError("Network error");
    }
  };

  if (loading || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!deal) return null;

  const urgency = urgencyLevel(deal.originalStartTime);
  const savings = (Number(deal.service.originalPrice) - Number(deal.discountedPrice)).toFixed(2);

  return (
    <div className="relative min-h-screen bg-[#0a0a0b]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-8">
        {/* Back */}
        <Link href="/" className="mb-6 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to deals
        </Link>

        {/* Booked state */}
        {booked ? (
          <div className="animate-in fade-in zoom-in duration-300 mt-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/15">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20,6 9,17 4,12" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Booked! 🎉</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Your appointment for <span className="text-white font-medium">{deal.service.name}</span> at{" "}
              <span className="text-white font-medium">{deal.business.name}</span> is confirmed.
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {formatDate(deal.originalStartTime)}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/bookings" className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2 text-sm font-medium text-zinc-300 hover:bg-white/[0.06]">
                View my bookings
              </Link>
              <Link href="/" className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500">
                Browse more deals
              </Link>
            </div>
          </div>
        ) : (
          <div className={`transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            {/* Main card */}
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02]" />
              <div className="relative rounded-2xl bg-[#111113]/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
                {/* Urgency */}
                <div className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${urgency.color}`}>
                  {urgency.label} · {timeUntil(deal.originalStartTime)} left
                </div>

                {/* Business header */}
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-2xl">
                    {CATEGORY_META[deal.business.category]?.icon || "📋"}
                  </div>
                  <div>
                    <Link href={`/b/${deal.business.slug}`} className="hover:underline hover:text-blue-400">
                      <h2 className="text-lg font-semibold text-white">{deal.business.name}</h2>
                    </Link>
                    <p className="text-sm text-zinc-500">
                      {deal.business.address}, {deal.business.city} · ⭐ {deal.business.avgRating.toFixed(1)}
                    </p>
                  </div>
                  {session && (
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        setWatchLoading(true);
                        try {
                          const res = await fetch("/api/watchlist", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ businessId: deal.business.id }),
                          });
                          const data = await res.json();
                          setWatching(data.watching);
                        } catch {} finally {
                          setWatchLoading(false);
                        }
                      }}
                      disabled={watchLoading}
                      className={`ml-auto flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border transition-all ${
                        watching
                          ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                      }`}
                      title={watching ? "Unwatch business" : "Watch business"}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill={watching ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Service info */}
                <div className="mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <h3 className="text-xl font-bold text-white">{deal.service.name}</h3>
                  {deal.service.description && (
                    <p className="mt-1 text-sm text-zinc-400">{deal.service.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {deal.service.durationMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {formatDate(deal.originalStartTime)}
                    </span>
                    <span>{CATEGORY_META[deal.service.category]?.label}</span>
                  </div>
                </div>

                {/* Pricing breakdown */}
                <div className="mb-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Original price</span>
                    <span className="text-zinc-400 line-through">${Number(deal.service.originalPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-400">Discount ({deal.discountPercent}%)</span>
                    <span className="text-emerald-400">-${savings}</span>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-white">You pay</span>
                    <span className="text-2xl font-bold text-white">${Number(deal.discountedPrice).toFixed(2)}</span>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {/* Payment form or Book button */}
                {showPayment && stripePromise ? (
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      deal={deal}
                      onSuccess={() => setBooked(true)}
                      onCancel={() => setShowPayment(false)}
                    />
                  </Elements>
                ) : (
                  <button
                    onClick={handleBookClick}
                    disabled={deal.status !== "AVAILABLE"}
                    className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-sm font-semibold text-white shadow-xl shadow-blue-500/25 transition-all hover:shadow-2xl hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="relative flex items-center justify-center gap-2">
                      {deal.status !== "AVAILABLE" ? (
                        "No longer available"
                      ) : (
                        <>⚡ Book Now — ${Number(deal.discountedPrice).toFixed(2)}</>
                      )}
                    </span>
                  </button>
                )}

                {deal.business.phone && (
                  <p className="mt-3 text-center text-xs text-zinc-600">
                    Questions? Call <a href={`tel:${deal.business.phone}`} className="text-blue-400 hover:text-blue-300">{deal.business.phone}</a>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
