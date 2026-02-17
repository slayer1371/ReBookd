"use client";

import { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24">
      {/* Background elements */}
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[120px] -translate-x-32 translate-y-20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div
            className={`mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-zinc-300">
              Live deals near you
            </span>
          </div>

          {/* Headline */}
          <h1
            className={`font-display text-5xl font-bold tracking-tight text-white sm:text-7xl transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Last-minute bookings, {" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              unbeatable prices.
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className={`mx-auto mt-6 max-w-2xl text-lg text-zinc-400 transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Discover exclusive discounts on cancelled appointments at top-rated salons, gyms, spas, and clinics in your area.
          </p>

          {/* Search */}
          <div
            className={`mx-auto mt-10 max-w-xl transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <SearchBar placeholder="Search for massages, haircuts, yoga..." className="mx-auto" />
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-zinc-500">
              <span>Popular:</span>
              <Link href="/?category=MASSAGE" className="hover:text-white transition-colors">Massage</Link>
              <span>•</span>
              <Link href="/?category=HAIRCUT" className="hover:text-white transition-colors">Haircut</Link>
              <span>•</span>
              <Link href="/?category=DENTAL" className="hover:text-white transition-colors">Dental</Link>
              <span>•</span>
              <Link href="/?category=FACIAL" className="hover:text-white transition-colors">Facial</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
