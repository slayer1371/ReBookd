"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Types derived from Prisma (simplified for client props)
interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  originalPrice: number | string; // Decimal from Prisma comes as string or number depending on serialization
  category: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date | string;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface Cancellation {
  id: string;
  originalStartTime: Date | string;
  originalEndTime: Date | string;
  discountedPrice: number | string;
  discountPercent: number;
  status: string;
  service: Service;
}

interface BusinessProfileProps {
  business: {
    id: string;
    name: string;
    slug: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string | null;
    website: string | null;
    description: string | null;
    avgRating: number;
    category: string;
    logoUrl: string | null;
    coverUrl: string | null;
    _count: { watchers: number };
    services: Service[];
    reviews: Review[];
    cancellations: Cancellation[];
  };
  isWatching: boolean;
  currentUserId?: string;
}

const TABS = ["Deals", "Services", "Reviews"];

export default function BusinessProfileClient({
  business,
  isWatching: initialWatching,
  currentUserId,
}: BusinessProfileProps) {
  const [activeTab, setActiveTab] = useState("Deals");
  const [isWatching, setIsWatching] = useState(initialWatching);
  const [watchersCount, setWatchersCount] = useState(business._count.watchers);
  const router = useRouter();

  const toggleWatch = async () => {
    if (!currentUserId) {
      router.push("/login"); // or show auth modal
      return;
    }

    // Optimistic update
    const nextState = !isWatching;
    setIsWatching(nextState);
    setWatchersCount((prev) => (nextState ? prev + 1 : prev - 1));

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on error
      setIsWatching(!nextState);
      setWatchersCount((prev) => (!nextState ? prev + 1 : prev - 1));
    }
  };

  const CATEGORY_ICONS: Record<string, string> = {
    FITNESS: "💪", YOGA: "🧘", SALON: "💇", BARBERSHOP: "✂️", SPA: "🧖",
    MASSAGE: "💆", DENTAL: "🦷", MEDICAL: "🏥", PHYSIOTHERAPY: "🏋️",
    MENTAL_HEALTH: "🧠", RESTAURANT: "🍽️", OTHER: "📋",
  };

  const businessIcon = CATEGORY_ICONS[business.category] || "🏢";

  // Group services by category
  const servicesByCategory = business.services.reduce((acc, svc) => {
    const cat = svc.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <div className="min-h-screen bg-[#0a0a0b] pb-20">
      {/* Hero Header */}
      <div className="relative h-64 w-full overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] to-transparent opacity-90" />
        {/* Placeholder for cover image if we had one */}
        <div className="absolute inset-0 flex items-center justify-center text-zinc-800 text-9xl font-bold opacity-10 select-none">
          {business.name.slice(0, 1)}
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-32 max-w-5xl px-4 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-6">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-[#0a0a0b] bg-zinc-800 shadow-2xl">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt={business.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl">{businessIcon}</div>
              )}
            </div>
            <div className="mb-2">
              <h1 className="text-3xl font-bold text-white">{business.name}</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span> {business.avgRating.toFixed(1)} ({business.reviews.length} reviews)
                </span>
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span>{business.category}</span>
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span>{business.city}, {business.state}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={toggleWatch}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all hover:scale-105 active:scale-95 ${
                isWatching
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : "border-white/10 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={isWatching ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {isWatching ? "Watching" : "Watch"}
              <span className="ml-1 opacity-60">({watchersCount})</span>
            </button>
            <a
               href={`https://maps.google.com/?q=${encodeURIComponent(business.address + ", " + business.city)}`}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105 hover:bg-white/10 active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Directions
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12 flex gap-8 border-b border-white/10 text-sm font-medium">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
              {tab === "Deals" && business.cancellations.length > 0 && (
                <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400">
                  {business.cancellations.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {/* DEALS TAB */}
          {activeTab === "Deals" && (
            <div className="space-y-4">
              {business.cancellations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
                  <p className="text-zinc-500">No active deals right now.</p>
                  <p className="text-xs text-zinc-600">Watch this business to get notified when they post one.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {business.cancellations.map((c) => (
                    <Link href={`/deals/${c.id}`} key={c.id}>
                      <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-5 transition-all hover:border-blue-500/50 hover:bg-zinc-800 hover:shadow-2xl hover:shadow-blue-500/10">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-400">
                            {business.category}
                          </span>
                          <span className="text-xs font-medium text-red-400 animate-pulse">
                            -{c.discountPercent}%
                          </span>
                        </div>
                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {c.service.name}
                        </h3>
                        <div className="mt-4 flex items-end justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs text-zinc-500 line-through">${Number(c.service.originalPrice).toFixed(0)}</span>
                            <span className="text-xl font-bold text-white">${Number(c.discountedPrice).toFixed(0)}</span>
                          </div>
                          <div className="text-right text-xs text-zinc-400">
                             <p>{new Date(c.originalStartTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                             <p>{new Date(c.originalStartTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === "Services" && (
            <div className="grid gap-8 sm:grid-cols-2">
              {Object.entries(servicesByCategory).map(([cat, services]) => (
                <div key={cat}>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">{cat}</h3>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
                    {services.map((svc, i) => (
                      <div key={svc.id} className={`p-4 ${i !== services.length - 1 ? "border-b border-white/5" : ""}`}>
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium text-white">{svc.name}</p>
                            {svc.description && <p className="mt-1 text-sm text-zinc-500">{svc.description}</p>}
                          </div>
                          <div className="text-right">
                             <p className="font-medium text-zinc-300 ml-4">${Number(svc.originalPrice).toFixed(0)}</p>
                             <p className="text-xs text-zinc-600">{svc.durationMinutes}m</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {business.services.length === 0 && (
                <p className="text-zinc-500">No services listed.</p>
              )}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === "Reviews" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {business.reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-white/10 bg-zinc-900 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {review.user.image ? (
                      <img src={review.user.image} alt={review.user.name || "User"} className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs">
                        {(review.user.name || "U")[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{review.user.name || "Rebookd User"}</p>
                      <p className="text-xs text-zinc-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={s <= review.rating ? "text-yellow-400" : "text-zinc-800"}>★</span>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-zinc-300 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
              {business.reviews.length === 0 && (
                <p className="text-zinc-500 col-span-full text-center py-10">No reviews yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
