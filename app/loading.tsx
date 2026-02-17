import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          {/* Logo Spinner */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse" />
        </div>
        <Skeleton className="h-4 w-32 bg-white/10" />
      </div>
    </div>
  );
}
