"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

interface WatchlistItem {
  id: string;
  business: {
    id: string;
    name: string;
    slug: string;
    category: string;
    address: string;
    city: string;
    avgRating: number;
    logoUrl: string | null;
    _count: { cancellations: number };
  };
}

export default function WatchlistPage() {
  const { status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/watchlist")
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [status]);

  const handleUnwatch = async (businessId: string) => {
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    });
    setItems((prev) => prev.filter((w) => w.business.id !== businessId));
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0b]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-pink-600/10 blur-[140px]" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to deals
        </Link>

        <div className={`mb-6 transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-400"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            My Watchlist
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Businesses you&apos;re following. You&apos;ll be notified when they post new deals.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-5xl">🤍</span>
            <h3 className="mt-4 text-lg font-semibold text-white">No businesses watched yet</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Tap the heart on a deal card to watch a business and get notified about new deals.
            </p>
            <Link href="/" className="mt-4 inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
              Browse deals →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div
                key={item.id}
                className={`relative rounded-xl border border-white/[0.06] bg-[#111113]/70 backdrop-blur-xl p-4 transition-all ${
                  mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
                style={{ transitionDelay: `${100 + i * 50}ms`, transitionDuration: "700ms" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] text-lg">
                      {CATEGORY_META[item.business.category]?.icon || "📋"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{item.business.name}</h3>
                      <p className="text-xs text-zinc-500">
                        {item.business.city} · ⭐ {item.business.avgRating.toFixed(1)}
                        {item.business._count.cancellations > 0 && (
                          <span className="ml-2 text-emerald-400">
                            {item.business._count.cancellations} deal{item.business._count.cancellations > 1 ? "s" : ""} live
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnwatch(item.business.id)}
                    className="rounded-lg p-2 text-pink-400 hover:bg-pink-500/10 transition-colors"
                    title="Unwatch"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
