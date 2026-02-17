"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SearchResult {
  businesses: {
    id: string;
    name: string;
    slug: string;
    category: string;
    city: string;
    logoUrl: string | null;
  }[];
  services: {
    id: string;
    name: string;
    business: {
      name: string;
      slug: string;
    };
  }[];
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ placeholder, className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        setLoading(true);
        fetch(`/api/search?q=${encodeURIComponent(query)}`)
          .then((res) => res.json())
          .then((data) => {
            setResults(data);
            setLoading(false);
            setOpen(true);
          })
          .catch(() => setLoading(false));
      } else {
        setResults(null);
        setOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className || "max-w-sm"}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || "Search businesses, services..."}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          onFocus={() => {
            if (query.length >= 2 && results) setOpen(true);
          }}
        />
        <div className="absolute left-3 top-2.5 text-zinc-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </div>

      {open && results && (
        <div className="relative mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#18181b] shadow-2xl z-50">
          {results.businesses.length === 0 && results.services.length === 0 ? (
            <div className="p-4 text-center text-sm text-zinc-500">No results found</div>
          ) : (
            <>
              {results.businesses.length > 0 && (
                <div className="p-2">
                  <div className="mb-1 px-2 text-xs font-semibold uppercase text-zinc-500">Businesses</div>
                  {results.businesses.map((biz) => (
                    <Link
                      key={biz.id}
                      href={`/b/${biz.slug}`}
                      onClick={handleSelect}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 text-lg">
                        {biz.logoUrl ? (
                          <img src={biz.logoUrl} alt={biz.name} className="h-full w-full rounded-md object-cover" />
                        ) : (
                          "🏢"
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{biz.name}</p>
                        <p className="text-xs text-zinc-500">{biz.category} • {biz.city}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.services.length > 0 && (
                <div className="border-t border-white/10 p-2">
                  <div className="mb-1 px-2 text-xs font-semibold uppercase text-zinc-500">Services</div>
                  {results.services.map((svc) => (
                    <Link
                      key={svc.id}
                      href={`/b/${svc.business.slug}`}
                      onClick={handleSelect}
                      className="group block rounded-lg p-2 hover:bg-white/5"
                    >
                      <p className="text-sm font-medium text-white group-hover:text-blue-400">{svc.name}</p>
                      <p className="text-xs text-zinc-500">at {svc.business.name}</p>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
