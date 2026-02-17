import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] pb-20">
      {/* Hero Header */}
      <div className="relative h-64 w-full bg-zinc-900 animate-pulse" />

      <div className="relative z-10 mx-auto -mt-32 max-w-5xl px-4 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-6">
            {/* Logo */}
            <Skeleton className="h-32 w-32 rounded-2xl border-4 border-[#0a0a0b]" />
            <div className="mb-2 space-y-2">
              <Skeleton className="h-8 w-48" /> {/* Name */}
              <Skeleton className="h-4 w-64" /> {/* Rating/Info */}
            </div>
          </div>

          <div className="flex gap-3">
            <Skeleton className="h-10 w-24 rounded-xl" /> {/* Watch */}
            <Skeleton className="h-10 w-28 rounded-xl" /> {/* Directions */}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12 flex gap-8 border-b border-white/10 pb-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>

        {/* Tab Content (Simulate Deals Grid) */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl border border-white/5 bg-zinc-900/50 p-5 space-y-4">
               <div className="flex justify-between">
                 <Skeleton className="h-6 w-20 rounded-full" />
                 <Skeleton className="h-4 w-12" />
               </div>
               <Skeleton className="h-6 w-3/4" />
               <div className="flex justify-between items-end mt-8">
                 <div className="space-y-1">
                   <Skeleton className="h-3 w-10" />
                   <Skeleton className="h-8 w-16" />
                 </div>
                 <div className="space-y-1">
                   <Skeleton className="h-3 w-16" />
                   <Skeleton className="h-3 w-24" />
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
