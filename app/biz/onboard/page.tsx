"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const CATEGORIES = [
  { value: "FITNESS", label: "Fitness & Gym", icon: "💪" },
  { value: "YOGA", label: "Yoga Studio", icon: "🧘" },
  { value: "SALON", label: "Salon", icon: "💇" },
  { value: "BARBERSHOP", label: "Barbershop", icon: "✂️" },
  { value: "SPA", label: "Spa & Wellness", icon: "🧖" },
  { value: "MASSAGE", label: "Massage", icon: "💆" },
  { value: "DENTAL", label: "Dental", icon: "🦷" },
  { value: "MEDICAL", label: "Medical", icon: "🏥" },
  { value: "PHYSIOTHERAPY", label: "Physiotherapy", icon: "🏋️" },
  { value: "MENTAL_HEALTH", label: "Mental Health", icon: "🧠" },
  { value: "RESTAURANT", label: "Restaurant", icon: "🍽️" },
  { value: "OTHER", label: "Other", icon: "📋" },
];

const STEPS = [
  { id: 1, title: "Category", desc: "What type of business?" },
  { id: 2, title: "Details", desc: "Name & description" },
  { id: 3, title: "Location", desc: "Where are you?" },
  { id: 4, title: "Contact", desc: "How to reach you" },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function OnboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (name && !slug) {
      setSlug(slugify(name));
    }
  }, [name, slug]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!category;
      case 2:
        return name.length >= 1 && slug.length >= 2;
      case 3:
        return address && city && state && zip;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          name,
          slug: slugify(slug),
          description: description || undefined,
          address,
          city,
          state,
          zip,
          lat: lat || 40.7128, // Fallback to NYC only if geocoding failed completely
          lng: lng || -74.006,
          phone: phone || undefined,
          website: website || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/biz/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div
        className={`w-full max-w-[560px] transition-all duration-1000 ease-out ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => s.id < step && setStep(s.id)}
                className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                  s.id === step
                    ? "text-emerald-400"
                    : s.id < step
                    ? "text-emerald-600 cursor-pointer hover:text-emerald-400"
                    : "text-zinc-600"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                    s.id === step
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : s.id < step
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/5 text-zinc-600"
                  }`}
                >
                  {s.id < step ? "✓" : s.id}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </div>
          <div className="h-1 w-full rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="relative">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02]" />
          <div className="relative rounded-2xl bg-[#111113]/80 backdrop-blur-2xl px-8 py-10 shadow-2xl shadow-black/40">
            {/* Step 1: Category */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="mb-1 text-xl font-semibold text-white">
                  What type of business do you run?
                </h2>
                <p className="mb-6 text-sm text-zinc-400">
                  Choose the category that best describes your services.
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`group flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-all ${
                        category === cat.value
                          ? "border-emerald-500/50 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10"
                          : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-zinc-200"
                      }`}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
                <div>
                  <h2 className="mb-1 text-xl font-semibold text-white">
                    Tell us about your business
                  </h2>
                  <p className="mb-6 text-sm text-zinc-400">
                    This is how customers will find and recognize you.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug || slug === slugify(name)) {
                        setSlug(slugify(e.target.value));
                      }
                    }}
                    placeholder="e.g. Glow Studio"
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/25"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                    URL Slug *
                  </label>
                  <div className="flex items-center gap-0">
                    <span className="flex h-11 items-center rounded-l-xl border border-r-0 border-white/[0.08] bg-white/[0.02] px-3 text-xs text-zinc-500">
                      rebookd.com/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) =>
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "")
                        )
                      }
                      placeholder="glow-studio"
                      className="h-11 w-full rounded-r-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/25"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What makes your business special?"
                    rows={3}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/25 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
                <div>
                  <h2 className="mb-1 text-xl font-semibold text-white">
                    Where are you located?
                  </h2>
                  <p className="mb-6 text-sm text-zinc-400">
                    Customers nearby will see your cancellation deals.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="350 5th Ave"
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/25"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                      City *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="New York"
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/25"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                      State *
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="NY"
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/25"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                      ZIP *
                    </label>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="10118"
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/25"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Contact */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
                <div>
                  <h2 className="mb-1 text-xl font-semibold text-white">
                    Contact information
                  </h2>
                  <p className="mb-6 text-sm text-zinc-400">
                    Optional, but helps build trust with customers.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (212) 555-1001"
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/25"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Website
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.yourbusiness.com"
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-500/25"
                  />
                </div>

                {/* Summary */}
                <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Category</span>
                      <span className="text-white">
                        {CATEGORIES.find((c) => c.value === category)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Name</span>
                      <span className="text-white">{name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">URL</span>
                      <span className="text-emerald-400">
                        rebookd.com/{slug}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Location</span>
                      <span className="text-white">
                        {city}, {state} {zip}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < STEPS.length ? (
                <button
                  onClick={async () => {
                    if (step === 3 && canProceed()) {
                      setLoading(true);
                      try {
                        const query = `${address}, ${city}, ${state} ${zip}`;
                        const res = await fetch(`/api/geo/geocode?q=${encodeURIComponent(query)}`);
                        const data = await res.json();
                        if (data.lat && data.lng) {
                          setLat(data.lat);
                          setLng(data.lng);
                        }
                      } catch (e) {
                        console.error("Geocoding failed", e);
                        // We continue anyway, will fallback or user can edit later
                      } finally {
                        setLoading(false);
                        setStep(step + 1);
                      }
                    } else if (canProceed()) {
                      setStep(step + 1);
                    }
                  }}
                  disabled={!canProceed() || loading}
                  className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative">Continue</span>
                  <svg
                    className="relative"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                  className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative flex items-center gap-2">
                    {loading ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        Launch Business
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
