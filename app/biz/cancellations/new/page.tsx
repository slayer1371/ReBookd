"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  originalPrice: string;
}

interface Business {
  id: string;
  name: string;
  services: Service[];
}

function addMinutes(date: Date, mins: number) {
  return new Date(date.getTime() + mins * 60000);
}

function toLocalDatetimeString(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function NewCancellationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [serviceId, setServiceId] = useState("");
  const [startTime, setStartTime] = useState(() =>
    toLocalDatetimeString(new Date(Date.now() + 3600000))
  );
  const [minDiscount, setMinDiscount] = useState("10");
  const [maxDiscount, setMaxDiscount] = useState("50");
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status !== "authenticated") return;

    fetch("/api/business")
      .then((r) => {
        if (r.status === 404) { router.push("/biz/onboard"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setBusiness(data);
          if (data.services.length > 0) setServiceId(data.services[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, router]);

  const selectedService = business?.services.find((s) => s.id === serviceId);

  const handleGenerateAI = async () => {
    if (!business || !selectedService) return;
    setGenerating(true);
    try {
      const prompt = `Write a short, catchy 1-sentence description for a ${selectedService.name} cancellation slot at ${business.name} starting at ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. The deal offers up to ${maxDiscount}% off. Make it urgent but professional.`;
      
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      if (data.text) setDescription(data.text);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !selectedService) return;
    setPosting(true);
    setError("");

    const start = new Date(startTime);
    const end = addMinutes(start, selectedService.durationMinutes);

    try {
      const res = await fetch("/api/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          originalStartTime: start.toISOString(),
          originalEndTime: end.toISOString(),
          minDiscount: parseInt(minDiscount),
          maxDiscount: parseInt(maxDiscount),
          description, // Pass description to backend
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to post");
        setPosting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/biz/dashboard"), 1500);
    } catch {
      setError("Network error");
      setPosting(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!business) return null;

  // Calculate preview discount
  const previewStart = new Date(startTime);
  const hoursUntil = Math.max(0, (previewStart.getTime() - Date.now()) / 3600000);
  let previewDiscount = 50;
  if (hoursUntil > 24) previewDiscount = 10;
  else if (hoursUntil > 12) previewDiscount = 15;
  else if (hoursUntil > 6) previewDiscount = 20;
  else if (hoursUntil > 3) previewDiscount = 25;
  else if (hoursUntil > 1) previewDiscount = 35;
  else if (hoursUntil > 0.5) previewDiscount = 45;
  previewDiscount = Math.max(
    parseInt(minDiscount),
    Math.min(parseInt(maxDiscount), previewDiscount)
  );
  const previewPrice = selectedService
    ? (Number(selectedService.originalPrice) * (1 - previewDiscount / 100)).toFixed(2)
    : "0.00";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[520px]">
        <Link href="/biz/dashboard" className="mb-6 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Dashboard
        </Link>

        {/* Success state */}
        {success ? (
          <div className="animate-in fade-in zoom-in duration-300 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
            </div>
            <h2 className="text-xl font-bold text-white">Posted!</h2>
            <p className="mt-1 text-sm text-zinc-400">Your cancellation slot is live. Redirecting to dashboard...</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02]" />
            <div className="relative rounded-2xl bg-[#111113]/80 backdrop-blur-2xl px-8 py-10 shadow-2xl">
              <h2 className="mb-1 text-xl font-semibold text-white">Post a Cancellation</h2>
              <p className="mb-6 text-sm text-zinc-400">
                Fill an empty slot — the discount is calculated automatically.
              </p>

              {business.services.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-zinc-400">Add services first</p>
                  <Link href="/biz/services" className="mt-2 inline-flex text-sm text-emerald-400 hover:text-emerald-300">
                    Go to Services →
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Service picker */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Service *</label>
                    <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#111113] px-4 text-sm text-white outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25">
                      {business.services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — ${Number(s.originalPrice).toFixed(2)} ({s.durationMinutes}min)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start time */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Appointment Start Time *</label>
                    <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                      min={toLocalDatetimeString(new Date())}
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 [color-scheme:dark]" />
                  </div>

                  {/* Discount bounds */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Min Discount %</label>
                      <input type="number" value={minDiscount} onChange={(e) => setMinDiscount(e.target.value)} min="0" max="100"
                        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Max Discount %</label>
                      <input type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} min="0" max="100"
                        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25" />
                    </div>
                  </div>

                  {/* Description with AI */}
                  <div>
                     <div className="mb-1.5 flex items-center justify-between">
                        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400">Description (Optional)</label>
                        <button
                          type="button"
                          onClick={handleGenerateAI}
                          disabled={generating}
                          className="flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                        >
                          {generating ? (
                             <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          ) : (
                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                          )}
                          {generating ? "Writing..." : "Auto-Write with AI"}
                        </button>
                     </div>
                     <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Last minute cancellation due to illness. Grab it now!"
                        className="h-24 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 custom-scrollbar resize-none"
                     />
                  </div>

                  {/* Live preview */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-400">Live Preview</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{selectedService?.name}</p>
                        <p className="text-xs text-zinc-500">
                          {hoursUntil >= 1
                            ? `Starts in ~${Math.floor(hoursUntil)}h ${Math.round((hoursUntil % 1) * 60)}m`
                            : `Starts in ~${Math.round(hoursUntil * 60)}m`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
                            {previewDiscount}% OFF
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-zinc-600 line-through">
                            ${selectedService ? Number(selectedService.originalPrice).toFixed(2) : "0.00"}
                          </span>
                          <span className="text-lg font-bold text-emerald-400">
                            ${previewPrice}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={posting}
                    className="group relative h-11 w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-50">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="relative flex items-center justify-center gap-2">
                      {posting ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Posting...
                        </>
                      ) : (
                        <>
                          🔥 Post Cancellation Deal
                        </>
                      )}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
