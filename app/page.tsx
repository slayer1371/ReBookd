"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import BusinessCTA from "@/components/landing/BusinessCTA";
import Footer from "@/components/Footer";

interface Cancellation {
  id: string;
  discountPercent: number;
  discountedPrice: number;
  originalStartTime: string;
  originalEndTime: string;
  status: string;
  distance: number | null;
  service: {
    id: string;
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
    lat: number;
    lng: number;
    avgRating: number;
    logoUrl: string | null;
  };
}

interface UserPreferences {
  categories: string[];
  searchRadius: number;
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

const ALL_CATEGORIES = Object.keys(CATEGORY_META);

function timeUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function urgencyColor(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  const hours = diff / 3600000;
  if (hours <= 1) return "text-red-400 bg-red-500/10 border-red-500/20";
  if (hours <= 3) return "text-orange-400 bg-orange-500/10 border-orange-500/20";
  if (hours <= 6) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
}

export default function LandingPage() {
  const { status } = useSession();
  const [items, setItems] = useState<Cancellation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Location & preferences
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied">("pending");
  const prefsLoaded = useRef(false);

  useEffect(() => {
    setMounted(true);

    // Request geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
          setLocationStatus("granted");
        },
        () => setLocationStatus("denied"),
        { timeout: 5000, maximumAge: 300000 }
      );
    } else {
      setLocationStatus("denied");
    }
  }, []);

  // Fetch user preferences when authenticated
  useEffect(() => {
    if (status !== "authenticated" || prefsLoaded.current) return;
    prefsLoaded.current = true;

    fetch("/api/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          // API returns { preferences: [{ category, enabled }], searchRadius }
          const enabledCategories = (data.preferences || [])
            .filter((p: { category: string; enabled: boolean }) => p.enabled)
            .map((p: { category: string }) => p.category);
          setUserPrefs({
            categories: enabledCategories,
            searchRadius: data.searchRadius || 10,
          });
        }
      })
      .catch(() => {});
  }, [status]);

  const fetchFeed = useCallback(
    async (cursor?: string | null, category?: string | null) => {
      const params = new URLSearchParams();
      if (category) {
        params.set("category", category);
      } else if (userPrefs?.categories?.length) {
        params.set("categories", userPrefs.categories.join(","));
      }
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "20");

      // Add location params if available
      if (userLat != null && userLng != null) {
        params.set("lat", String(userLat));
        params.set("lng", String(userLng));
        const radius = userPrefs?.searchRadius || 50; // default 50km if no prefs
        params.set("radius", String(radius));
      }

      const res = await fetch(`/api/cancellations?${params}`);
      const data = await res.json();
      return data;
    },
    [userLat, userLng, userPrefs]
  );

  // Refetch when location, prefs, or category changes
  useEffect(() => {
    // Wait for location to resolve (granted/denied) before first fetch,
    // but don't wait forever
    if (locationStatus === "pending") return;

    setLoading(true);
    fetchFeed(null, selectedCategory).then((data) => {
      setItems(data.items || []);
      setHasMore(data.hasMore || false);
      setNextCursor(data.nextCursor || null);
      setLoading(false);
    });
  }, [selectedCategory, fetchFeed, locationStatus]);

  // Also trigger once after a short timeout if location is still pending
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationStatus === "pending") setLocationStatus("denied");
    }, 3000);
    return () => clearTimeout(timer);
  }, [locationStatus]);

  const loadMore = async () => {
    if (!nextCursor) return;
    const data = await fetchFeed(nextCursor, selectedCategory);
    setItems((prev) => [...prev, ...(data.items || [])]);
    setHasMore(data.hasMore || false);
    setNextCursor(data.nextCursor || null);
  };

  // Live feed updates via SSE + 60s fallback
  useEffect(() => {
    if (locationStatus === "pending") return;

    // SSE for real-time updates (authenticated users)
    let es: EventSource | null = null;
    if (status === "authenticated") {
      es = new EventSource("/api/notifications/subscribe");
      es.addEventListener("feed-update", () => {
        fetchFeed(null, selectedCategory).then((data) => {
          setItems(data.items || []);
          setHasMore(data.hasMore || false);
          setNextCursor(data.nextCursor || null);
        });
      });
      es.onerror = () => {
        es?.close();
        es = null;
      };
    }

    // Fallback polling every 60s
    const interval = setInterval(() => {
      fetchFeed(null, selectedCategory).then((data) => {
        setItems(data.items || []);
        setHasMore(data.hasMore || false);
        setNextCursor(data.nextCursor || null);
      });
    }, 60000);

    return () => {
      es?.close();
      clearInterval(interval);
    };
  }, [selectedCategory, fetchFeed, locationStatus, status]);

  const hasActivePrefs = userPrefs?.categories?.length && userPrefs.categories.length > 0;

  return (
    <div className="relative min-h-screen bg-[#0a0a0b]">
        {/* Marketing Sections (Hero, Features, etc.) */}
        <Hero />
        
        {status !== "authenticated" && (
            <>
                <Features />
                <HowItWorks />
            </>
        )}

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[140px]" />
      </div>
      {/* Subtle grid overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.02]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }} />

      <div className="relative z-10" id="live-deals">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-8">
            <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Live Deals</h2>
                <p className="text-zinc-400">Real-time cancellations happening right now.</p>
            </div>

          {/* Category filters */}
          <div className={`mb-6 transition-all duration-700 delay-100 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  !selectedCategory
                    ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                    : "bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:bg-white/[0.06] hover:text-zinc-300"
                }`}
              >
                {hasActivePrefs ? "My Preferences" : "All"}
              </button>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? null : cat)
                  }
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                      : "bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:bg-white/[0.06] hover:text-zinc-300"
                  }`}
                >
                  {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
                </button>
              ))}
            </div>
            {/* Active filter badges */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {locationStatus === "granted" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Within {userPrefs?.searchRadius || 50} km
                </span>
              )}
              {hasActivePrefs && !selectedCategory && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-[11px] font-medium text-indigo-400">
                  Filtered by your preferences
                  <Link href="/preferences" className="ml-1 underline underline-offset-2 decoration-indigo-500/50 hover:text-indigo-300">edit</Link>
                </span>
              )}
            </div>
          </div>

          {/* Feed */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className={`text-center py-20 transition-all duration-700 delay-200 ${mounted ? "opacity-100" : "opacity-0"}`}>
              <span className="text-5xl">📭</span>
              <h3 className="mt-4 text-lg font-semibold text-white">No deals right now</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {selectedCategory
                  ? `No ${CATEGORY_META[selectedCategory]?.label} cancellations available. Try another category.`
                  : locationStatus === "granted"
                  ? `No deals within ${userPrefs?.searchRadius || 50} km. Try increasing your search radius in preferences.`
                  : "Check back soon — deals appear when businesses have last-minute cancellations."
                }
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, i) => (
                  <Link
                    key={item.id}
                    href={`/deals/${item.id}`}
                    className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111113]/70 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 ${
                      mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                    style={{ transitionDelay: `${150 + i * 50}ms` }}
                  >
                    {/* Urgency badge */}
                    <div className="absolute right-3 top-3 z-10">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${urgencyColor(item.originalStartTime)}`}>
                        {timeUntil(item.originalStartTime)}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="p-5">
                      {/* Business */}
                      <div className="mb-3 flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-lg">
                          {CATEGORY_META[item.business.category]?.icon || "📋"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {item.business.name}
                          </p>
                          <p className="truncate text-xs text-zinc-600">
                            {item.business.city} · ⭐ {item.business.avgRating.toFixed(1)}
                            {item.distance != null && (
                              <span className="text-zinc-500"> · 📍 {item.distance} km</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Service name */}
                      <h3 className="mb-2 text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {item.service.name}
                      </h3>

                      {/* Time */}
                      <p className="mb-4 text-xs text-zinc-500">
                        <svg className="mr-1 -mt-0.5 inline h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {formatTime(item.originalStartTime)} · {item.service.durationMinutes}min
                      </p>

                      {/* Pricing */}
                      <div className="flex items-end justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-white">
                            ${Number(item.discountedPrice).toFixed(0)}
                          </span>
                          <span className="text-sm text-zinc-600 line-through">
                            ${Number(item.service.originalPrice).toFixed(0)}
                          </span>
                        </div>
                        <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-sm font-bold text-emerald-400">
                          {item.discountPercent}% OFF
                        </span>
                      </div>
                    </div>

                    {/* Bottom gradient line */}
                    <div className="h-[2px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={loadMore}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
                  >
                    Load more deals
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {status !== "authenticated" && (
         <>
            <BusinessCTA />
            <Footer />
         </>
      )}
    </div>
  );
}
