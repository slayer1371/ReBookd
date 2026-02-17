"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Service {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  originalPrice: string;
  description: string | null;
}

interface Business {
  id: string;
  name: string;
  category: string;
  services: Service[];
}

const CATEGORIES = [
  { value: "FITNESS", label: "Fitness" }, { value: "YOGA", label: "Yoga" },
  { value: "SALON", label: "Salon" }, { value: "BARBERSHOP", label: "Barbershop" },
  { value: "SPA", label: "Spa" }, { value: "MASSAGE", label: "Massage" },
  { value: "DENTAL", label: "Dental" }, { value: "MEDICAL", label: "Medical" },
  { value: "PHYSIOTHERAPY", label: "Physiotherapy" }, { value: "MENTAL_HEALTH", label: "Mental Health" },
  { value: "RESTAURANT", label: "Restaurant" }, { value: "OTHER", label: "Other" },
];

export default function ServicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // New service form
  const [svcName, setSvcName] = useState("");
  const [svcCategory, setSvcCategory] = useState("");
  const [svcDuration, setSvcDuration] = useState("60");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcDesc, setSvcDesc] = useState("");

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
          setSvcCategory(data.category);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, router]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/business/${business.id}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: svcName,
          category: svcCategory,
          durationMinutes: parseInt(svcDuration),
          originalPrice: parseFloat(svcPrice),
          description: svcDesc || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add service");
        setSaving(false);
        return;
      }

      const newService = await res.json();
      setBusiness({ ...business, services: [newService, ...business.services] });
      // Reset all form fields
      setSvcName("");
      setSvcPrice("");
      setSvcDesc("");
      setSvcDuration("60");
      setSvcCategory(business.category);
      setShowForm(false);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!business || !confirm("Delete this service?")) return;

    try {
      await fetch(`/api/business/${business.id}/services/${serviceId}`, {
        method: "DELETE",
      });
      setBusiness({
        ...business,
        services: business.services.filter((s) => s.id !== serviceId),
      });
    } catch {
      console.error("Failed to delete");
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

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/biz/dashboard" className="mb-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Dashboard
            </Link>
            <h1 className="text-xl font-bold text-white">Service Catalog</h1>
            <p className="text-sm text-zinc-400">{business.services.length} services</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative flex items-center gap-1.5">
              {showForm ? "Cancel" : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Service
                </>
              )}
            </span>
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAddService} className="mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-emerald-500/20 to-transparent" />
              <div className="relative rounded-2xl bg-[#111113]/90 backdrop-blur-xl p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Service Name *</label>
                    <input type="text" value={svcName} onChange={(e) => setSvcName(e.target.value)} required placeholder="e.g. 60-min Deep Tissue Massage"
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Category</label>
                    <select value={svcCategory} onChange={(e) => setSvcCategory(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#111113] px-4 text-sm text-white outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25">
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Duration (min) *</label>
                    <input type="number" value={svcDuration} onChange={(e) => setSvcDuration(e.target.value)} required min="5" max="480"
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Price ($) *</label>
                    <input type="number" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} required min="1" step="0.01" placeholder="85.00"
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Description</label>
                    <input type="text" value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} placeholder="Optional"
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={saving}
                  className="h-10 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50">
                  {saving ? "Saving..." : "Add Service"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Service list */}
        <div className="space-y-2">
          {business.services.map((svc) => (
            <div key={svc.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#111113]/60 backdrop-blur-xl p-4 transition-all hover:border-white/[0.1]">
              <div>
                <p className="text-sm font-medium text-white">{svc.name}</p>
                <p className="text-xs text-zinc-500">{svc.durationMinutes} min · {svc.category}</p>
                {svc.description && <p className="mt-1 text-xs text-zinc-600">{svc.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-white">${Number(svc.originalPrice).toFixed(2)}</p>
                <button onClick={() => handleDelete(svc.id)} className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/></svg>
                </button>
              </div>
            </div>
          ))}

          {business.services.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-12 text-center">
              <span className="text-4xl">🛠️</span>
              <p className="mt-3 text-sm text-zinc-400">No services yet</p>
              <p className="mt-1 text-xs text-zinc-500">Add the services you offer so you can post cancellation deals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
