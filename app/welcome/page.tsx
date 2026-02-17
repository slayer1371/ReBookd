"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    // If user already has a role, skip to the correct page
    if (session?.user?.role === "BUSINESS") router.push("/biz/dashboard");
    if (session?.user?.role === "CONSUMER") router.push("/");
  }, [status, session, router]);

  if (status === "loading" || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0b]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[100px] animate-pulse [animation-delay:2s]" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      <div
        className={`relative z-10 w-full max-w-[520px] mx-4 transition-all duration-1000 ease-out ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/25">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Hey {firstName}! 👋
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            How would you like to use Rebookd?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Consumer option */}
          <button
            onClick={() => router.push("/")}
            className="group relative w-full text-left"
          >
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-[#111113]/80 backdrop-blur-xl p-5 transition-all group-hover:border-indigo-500/30 group-hover:bg-white/[0.04]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-2xl">
                🔍
              </div>
              <div>
                <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  I&apos;m looking for deals
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Browse discounted last-minute cancellations from gyms, salons, clinics, and more near you.
                </p>
              </div>
              <svg className="mt-1 shrink-0 text-zinc-600 group-hover:text-indigo-400 transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </div>
          </button>

          {/* Business option */}
          <button
            onClick={() => router.push("/biz/onboard")}
            className="group relative w-full text-left"
          >
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-[#111113]/80 backdrop-blur-xl p-5 transition-all group-hover:border-emerald-500/30 group-hover:bg-white/[0.04]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
                🏪
              </div>
              <div>
                <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  I run a business
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Fill last-minute cancellations at a discount. List your salon, gym, clinic, or studio.
                </p>
              </div>
              <svg className="mt-1 shrink-0 text-zinc-600 group-hover:text-emerald-400 transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </div>
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          You can always switch later from your profile settings.
        </p>
      </div>
    </div>
  );
}
