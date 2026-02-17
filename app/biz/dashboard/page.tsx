"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { formatTime, timeUntil } from "@/lib/utils";

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  state: string;
  avgRating: number;
  verified: boolean;
  services: Array<{ id: string; name: string; originalPrice: string; durationMinutes: number }>;
  _count: { cancellations: number; bookings: number; reviews: number; watchers: number };
}

interface Cancellation {
  id: string;
  discountPercent: number;
  discountedPrice: number;
  originalStartTime: string;
  originalEndTime: string;
  status: string;
  service: { name: string; originalPrice: string };
}

export default function BizDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [stripeStatus, setStripeStatus] = useState<{ connected: boolean; detailsSubmitted: boolean; payoutsEnabled: boolean } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status !== "authenticated") return;

    async function load() {
      try {
        const [bizRes, stripeRes] = await Promise.all([
          fetch("/api/business"),
          fetch("/api/stripe/connect")
        ]);

        if (bizRes.status === 404) {
          router.push("/biz/onboard");
          return;
        }
        
        const bizData = await bizRes.json();
        setBusiness(bizData);

        if (stripeRes.ok) {
           const stripeData = await stripeRes.json();
           setStripeStatus(stripeData);
        }

        // Load cancellations for this business
        const cancelRes = await fetch(`/api/cancellations?businessId=${bizData.id}`);
        const cancelData = await cancelRes.json();
        setCancellations(cancelData.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [status, router]);

  const handleConnectStripe = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error("Failed to connect stripe", e);
      setLoading(false);
    }
  };

  if (loading || !mounted || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!business) return null;

  const stats = [
    { label: "Active Slots", value: cancellations.filter(c => c.status === "AVAILABLE").length, icon: "🔥", color: "from-orange-500/20 to-amber-500/20" },
    { label: "Total Bookings", value: business._count.bookings, icon: "📅", color: "from-blue-500/20 to-blue-500/20" },
    { label: "Services", value: business.services.length, icon: "🛠️", color: "from-cyan-500/20 to-pink-500/20" },
    { label: "Watchers", value: business._count.watchers, icon: "👁️", color: "from-emerald-500/20 to-teal-500/20" },
  ];

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{business.name}</h1>
              {business.verified && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  <Icons.Verified width={12} height={12} />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400">
              {business.city}, {business.state} · ⭐ {business.avgRating.toFixed(1)} · {business._count.reviews} reviews
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/biz/services"
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
            >
              Services
            </Link>
            <Link
              href="/biz/cancellations/new"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative flex items-center gap-1.5">
                <Icons.Plus width={14} height={14} />
                Post Cancellation
              </span>
            </Link>
          </div>
        </div>

        {/* Payouts / Stripe Connect Banner */}
        <div className="mb-8 overflow-hidden rounded-xl border border-white/[0.06] bg-[#111113]/60 backdrop-blur-xl">
          <div className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#635BFF]/10 text-[#635BFF]">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M13.9 10.3c.5-.3.8-.5 1.1-.7.3-.2.5-.5.5-.8 0-.5-.4-.7-.9-.7-.3 0-.6.1-.8.2-.2.2-.4.4-.6.7l-2.4-1.5c.5-.8 1.1-1.4 1.8-1.7.7-.4 1.5-.5 2.5-.5 1.1 0 2.1.3 2.9.8.9.6 1.3 1.5 1.3 2.6 0 .9-.3 1.7-.8 2.3-.5.6-1.1 1.1-2 1.5l-1 .5c-.3.2-.5.3-.6.5-.1.1-.1.3-.1.5 0 .4.4.7 1 .7.4 0 .8-.1 1.1-.3.3-.2.6-.5.8-.9l2.4 1.5c-.5.9-1.2 1.6-2 2-.9.5-1.9.7-3 .7-1.3 0-2.3-.3-3.1-.9-.8-.6-1.3-1.5-1.3-2.6 0-1 .3-1.9.9-2.5.5-.6 1.4-1.2 2.3-1.6z"/>
                 </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Payouts & Payments</h3>
                <p className="text-sm text-zinc-400">
                  {stripeStatus?.payoutsEnabled 
                    ? "Your account is active and ready to receive payouts." 
                    : "Connect your bank account to receive payments from customers."}
                </p>
              </div>
            </div>
            
            <div>
              {stripeStatus?.payoutsEnabled ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
                    <Icons.Verified width={16} height={16} />
                    Payouts Active
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/stripe/login", { method: "POST" });
                        const data = await res.json();
                        if (data.url) window.open(data.url, "_blank");
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    View Dashboard ↗
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectStripe}
                  className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-[#635BFF] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#635BFF]/30 transition-all hover:bg-[#635BFF]/90 hover:shadow-xl hover:shadow-[#635BFF]/40 active:scale-[0.98]"
                >
                  <span className="relative">Connect Stripe</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative transition-transform group-hover:translate-x-1">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111113]/60 backdrop-blur-xl p-4"
            >
              <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${stat.color} blur-2xl`} />
              <div className="relative">
                <span className="text-lg">{stat.icon}</span>
                <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Active cancellations */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active Cancellation Slots</h2>
            <Link href="/biz/cancellations/new" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              + Post new
            </Link>
          </div>

          {cancellations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-12 text-center">
              <span className="text-4xl">📭</span>
              <p className="mt-3 text-sm text-zinc-400">No active cancellation slots</p>
              <p className="mt-1 text-xs text-zinc-500">Post a cancellation to start filling empty slots</p>
              <Link
                href="/biz/cancellations/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                <Icons.Plus width={14} height={14} />
                Post one now
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {cancellations.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#111113]/60 backdrop-blur-xl p-4 transition-all hover:border-white/[0.1]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-bold">
                      {c.discountPercent}%
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{c.service.name}</p>
                      <p className="text-xs text-zinc-500">{formatTime(c.originalStartTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-400">${Number(c.discountedPrice).toFixed(2)}</p>
                      <p className="text-xs text-zinc-600 line-through">${Number(c.service.originalPrice).toFixed(2)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.status === "AVAILABLE"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : c.status === "BOOKED"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-zinc-500/10 text-zinc-400"
                    }`}>
                      {c.status === "AVAILABLE" ? timeUntil(c.originalStartTime) : c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Services quick view */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Your Services</h2>
            <Link href="/biz/services" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              Manage →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {business.services.map((svc) => (
              <div
                key={svc.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#111113]/60 backdrop-blur-xl p-4"
              >
                <div>
                  <p className="text-sm font-medium text-white">{svc.name}</p>
                  <p className="text-xs text-zinc-500">{svc.durationMinutes} min</p>
                </div>
                <p className="text-sm font-semibold text-white">${Number(svc.originalPrice).toFixed(2)}</p>
              </div>
            ))}
            {business.services.length === 0 && (
              <div className="col-span-2 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center">
                <p className="text-sm text-zinc-400">No services yet</p>
                <Link
                  href="/biz/services"
                  className="mt-2 inline-flex text-sm font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Add your first service →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
