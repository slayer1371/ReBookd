import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] pb-20 pt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-white/10">
           <Skeleton className="h-10 w-32 rounded-t-lg" />
           <Skeleton className="h-10 w-32 rounded-t-lg" />
        </div>

        {/* Booking Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-px w-full bg-white/5" />
              <div className="flex justify-between">
                 <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                 </div>
                 <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
