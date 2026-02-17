"use client";

import Link from "next/link";

export default function BusinessCTA() {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border border-emerald-500/20 px-6 py-16 sm:px-12 sm:py-24 lg:px-16">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-30" 
               style={{ backgroundImage: "radial-gradient(#10b981 1px, transparent 1px)", backgroundSize: "32px 32px" }} 
          />
          
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Run a business? Fill your empty slots.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-emerald-100/80">
              Stop losing revenue to cancellations. List your open appointments on Rebookd and get discovered by thousands of local customers.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/signin?role=business"
                className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 shadow-emerald-500/25"
              >
                Join as a Partner
              </Link>
              <Link href="/business" className="text-sm font-semibold leading-6 text-white hover:text-emerald-300 transition-colors">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
