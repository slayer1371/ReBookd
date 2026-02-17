"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  { value: "FITNESS", icon: "💪", label: "Fitness" },
  { value: "YOGA", icon: "🧘", label: "Yoga" },
  { value: "SALON", icon: "💇", label: "Salon" },
  { value: "BARBERSHOP", icon: "✂️", label: "Barbershop" },
  { value: "SPA", icon: "🧖", label: "Spa" },
  { value: "MASSAGE", icon: "💆", label: "Massage" },
  { value: "DENTAL", icon: "🦷", label: "Dental" },
  { value: "MEDICAL", icon: "🏥", label: "Medical" },
  { value: "PHYSIOTHERAPY", icon: "🏋️", label: "Physio" },
  { value: "MENTAL_HEALTH", icon: "🧠", label: "Mental Health" },
  { value: "RESTAURANT", icon: "🍽️", label: "Restaurant" },
  { value: "OTHER", icon: "📋", label: "Other" },
];

const RADIUS_OPTIONS = [1, 3, 5, 10, 15, 25, 50];

interface UserPref {
  category: string;
  enabled: boolean;
}

export default function PreferencesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Load existing preferences
  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/preferences").then(r => r.json()),
      fetch("/api/user/profile").then(r => r.json()),
    ]).then(([prefData, profileData]) => {
      const prefMap: Record<string, boolean> = {};
      // Default all categories to enabled
      CATEGORIES.forEach(c => { prefMap[c.value] = true; });
      // Override with saved preferences
      (prefData.preferences || []).forEach((p: UserPref) => {
        prefMap[p.category] = p.enabled;
      });
      setPrefs(prefMap);
      setRadius(profileData.searchRadius || 10);
    }).finally(() => setLoading(false));
  }, [status]);

  const handleToggle = (category: string) => {
    setPrefs(prev => ({ ...prev, [category]: !prev[category] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const preferences = Object.entries(prefs).map(([category, enabled]) => ({
      category,
      enabled,
    }));

    await Promise.all([
      fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      }),
      fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchRadius: radius }),
      }),
    ]);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0b]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to deals
        </Link>

        <div className={`mb-8 transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Preferences
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Customize your feed. Only deals matching your preferences will show up.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Categories */}
            <div className={`transition-all duration-700 delay-100 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Categories
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => handleToggle(cat.value)}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                      prefs[cat.value]
                        ? "border-blue-500/30 bg-blue-500/10 text-white"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-600 hover:border-white/[0.12] hover:text-zinc-400"
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                    {prefs[cat.value] && (
                      <svg className="ml-auto h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Radius */}
            <div className={`transition-all duration-700 delay-200 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Search Radius
              </h2>
              <div className="flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRadius(r); setSaved(false); }}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                      radius === r
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        : "bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:bg-white/[0.06]"
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-zinc-600">
                Show deals from businesses within {radius} km of your location.
              </p>
            </div>

            {/* Save */}
            <div className={`transition-all duration-700 delay-300 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
              <button
                onClick={handleSave}
                disabled={saving}
                className="group relative h-11 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative flex items-center justify-center gap-2">
                  {saving ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Saved!
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
