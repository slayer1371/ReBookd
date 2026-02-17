"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

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

const ALL_CATEGORIES = Object.keys(CATEGORY_META);

interface NearbyBusiness {
  id: string;
  name: string;
  slug: string;
  category: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  phone: string | null;
  avgRating: number;
  logoUrl: string | null;
  description: string | null;
  distance: number;
  _count: {
    cancellations: number;
    reviews: number;
    watchers: number;
    services: number;
  };
}

export default function BusinessesPage() {
  const { data: session, status: authStatus } = useSession();
  const [businesses, setBusinesses] = useState<NearbyBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Store coordinates in a ref so fetchBusinesses doesn't depend on them
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Get user location — runs once
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        coordsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 5000 }
    );
    // Fallback timeout
    const timer = setTimeout(() => {
      setLocationStatus((prev) => (prev === "pending" ? "denied" : prev));
    }, 5000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch watchlist
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetch("/api/watchlist")
      .then((r) => r.json())
      .then((data) => {
        const ids = new Set<string>(
          (data || []).map((w: { businessId: string }) => w.businessId)
        );
        setWatchedIds(ids);
      })
      .catch(() => {});
  }, [authStatus]);

  // Fetch nearby businesses — only depends on selectedCategory (coords are in ref)
  const fetchBusinesses = useCallback(async () => {
    const coords = coordsRef.current;
    if (!coords) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
      params.set("radius", "50");
      if (selectedCategory) params.set("category", selectedCategory);

      const res = await fetch(`/api/business/nearby?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.items || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (locationStatus === "pending") return;
    fetchBusinesses();
  }, [locationStatus, fetchBusinesses]);

  // Toggle watchlist
  const toggleWatch = async (businessId: string) => {
    if (!session) return;
    setTogglingId(businessId);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      setWatchedIds((prev) => {
        const next = new Set(prev);
        if (data.watching) next.add(businessId);
        else next.delete(businessId);
        return next;
      });
    } catch {} finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0b]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[140px]" />
      </div>
      <div className="pointer-events-none fixed inset-0 opacity-[0.02]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }} />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Businesses around you
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {locationStatus === "granted"
              ? "Sorted by distance · Watch businesses to get notified about their deals"
              : "Enable location to see nearby businesses"}
          </p>
        </div>

        {/* Category filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              !selectedCategory
                ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30"
                : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-300"
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30"
                  : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-300"
              }`}
            >
              {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-zinc-500">No businesses found nearby</p>
            <p className="mt-1 text-sm text-zinc-600">
              {locationStatus !== "granted"
                ? "Allow location access to discover businesses near you"
                : "Try a different category or increase your radius"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((biz) => {
              const meta = CATEGORY_META[biz.category] || CATEGORY_META.OTHER;
              const isWatched = watchedIds.has(biz.id);

              return (
                <div
                  key={biz.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-white/[0.1] hover:bg-white/[0.04]"
                >
                  {/* Card content — clickable link to business profile */}
                  <Link href={`/b/${biz.slug}`} className="block p-5">
                    {/* Top row: icon + name + watch */}
                    <div className="mb-3 flex items-start gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xl">
                        {meta.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {biz.name}
                        </h3>
                        <p className="text-xs text-zinc-500 truncate">
                          {biz.address}, {biz.city}
                        </p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="mb-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        📍 {biz.distance} km
                      </span>
                      <span className="flex items-center gap-1">
                        ⭐ {biz.avgRating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        🏷️ {biz._count.services} services
                      </span>
                      {biz._count.cancellations > 0 && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          🔥 {biz._count.cancellations} live deal{biz._count.cancellations !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {biz.description && (
                      <p className="mb-3 text-xs text-zinc-600 line-clamp-2">
                        {biz.description}
                      </p>
                    )}

                    {/* Category pill */}
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-zinc-400">
                      {meta.icon} {meta.label}
                    </span>
                  </Link>

                  {/* Watch button — absolutely positioned */}
                  {session && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWatch(biz.id);
                      }}
                      disabled={togglingId === biz.id}
                      className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                        isWatched
                          ? "border-red-500/30 bg-red-500/15 text-red-400 hover:bg-red-500/25"
                          : "border-white/[0.08] bg-black/40 text-zinc-500 opacity-0 backdrop-blur-sm group-hover:opacity-100 hover:bg-white/[0.08] hover:text-white"
                      }`}
                      title={isWatched ? "Unwatch" : "Watch this business"}
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={isWatched ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  )}

                  {/* Watched indicator — always visible when watched */}
                  {isWatched && (
                    <div className="absolute left-3 top-3 rounded-md bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-red-400">
                      Watching
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
