"use client";

const STEPS = [
  {
    number: "01",
    title: "Browse Deals",
    description: "Search for last-minute cancellations in your area. filter by category, price, or location.",
  },
  {
    number: "02",
    title: "Book Instantly",
    description: "Secure your slot in seconds with our seamless checkout. No phone calls required.",
  },
  {
    number: "03",
    title: "Save Big",
    description: "Enjoy premium services at a fraction of the cost. Show up and enjoy your appointment.",
  },
];

export default function HowItWorks() {
  return (
    <div className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-6">
              How Rebookd Works
            </h2>
            <div className="space-y-12">
              {STEPS.map((step, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-lg font-bold text-white group-hover:bg-indigo-500 group-hover:border-indigo-500 transition-all duration-300">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-zinc-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
             {/* Abstract visual representation of the app interface or flow */}
             <div className="aspect-square rounded-3xl border border-white/10 bg-[#111113] p-4 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
               <div className="h-full w-full rounded-2xl bg-gradient-to-br from-zinc-800 to-black overflow-hidden relative">
                  <div className="absolute inset-0 bg-[url('https://placehold.co/600x600/111/444')] opacity-20 mix-blend-overlay" />
                  
                  {/* Mock UI Elements */}
                  <div className="absolute top-8 left-8 right-8 h-4 bg-white/10 rounded-full" />
                  <div className="absolute top-16 left-8 w-1/2 h-4 bg-white/5 rounded-full" />
                  
                  <div className="absolute top-32 left-8 right-8 bottom-8 grid grid-cols-2 gap-4">
                     <div className="rounded-xl bg-white/5 border border-white/5" />
                     <div className="rounded-xl bg-white/5 border border-white/5" />
                     <div className="rounded-xl bg-white/5 border border-white/5" />
                     <div className="rounded-xl bg-white/5 border border-white/5" />
                  </div>

                  {/* Floating badge */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 px-6 py-3 rounded-xl shadow-xl shadow-indigo-600/40 animate-pulse">
                    <span className="text-white font-bold">Booked!</span>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
