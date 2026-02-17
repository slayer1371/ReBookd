"use client";

import { Icons } from "@/components/ui/icons";

const FEATURES = [
  {
    title: "Instant Savings",
    description: "Get up to 70% off on premium services. Prices drop as the appointment time gets closer.",
    icon: <Icons.Deals className="h-6 w-6 text-emerald-400" />,
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/20",
  },
  {
    title: "Support Local",
    description: "Help local businesses fill empty slots and reduce waste. It's a win-win for everyone.",
    icon: <Icons.Nearby className="h-6 w-6 text-blue-400" />,
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/20",
  },
  {
    title: "Seamless Booking",
    description: "Book in seconds. No phone calls, no hassle. Secure payments powered by Stripe.",
    icon: <Icons.Bookings className="h-6 w-6 text-pink-400" />,
    gradient: "from-pink-500/20 to-rose-500/20",
    border: "border-pink-500/20",
  },
];

export default function Features() {
  return (
    <div className="py-24 bg-[#0a0a0b]/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
            Why use Rebookd?
          </h2>
          <p className="text-zinc-400">
            We're changing how local services are booked. Less waste for businesses, more savings for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-3xl border ${feature.border} bg-[#111113]/50 p-8 hover:bg-[#111113] transition-colors duration-300 group`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              <div className="relative z-10">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
