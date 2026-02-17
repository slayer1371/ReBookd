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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status !== "authenticated") return;

    async function load() {
      try {
        const bizRes = await fetch("/api/business");
        if (bizRes.status === 404) {
          router.push("/biz/onboard");
          return;
        }
        const bizData = await bizRes.json();
        setBusiness(bizData);

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
    { label: "Total Bookings", value: business._count.bookings, icon: "📅", color: "from-blue-500/20 to-indigo-500/20" },
    { label: "Services", value: business.services.length, icon: "🛠️", color: "from-purple-500/20 to-pink-500/20" },
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
