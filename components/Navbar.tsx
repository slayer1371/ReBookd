"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import SearchBar from "@/components/SearchBar";

const HIDE_NAVBAR = ["/login", "/signup", "/signup/verify", "/welcome"];

/* ─── Icon components ─────────────────────────────────────────── */
import { Icons } from "@/components/ui/icons";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hidden = HIDE_NAVBAR.some((p) => pathname.startsWith(p));
  const isBizPage = pathname.startsWith("/biz");
  const isBiz = session?.user?.role === "BUSINESS";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  if (hidden) return null;

  const accent = isBiz || isBizPage ? "emerald" : "indigo";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/[0.06] bg-[#0a0a0b]/95 backdrop-blur-xl shadow-lg shadow-black/30"
          : "border-b border-white/[0.04] bg-[#0a0a0b]"
      }`}
    >
      {/* Top accent line */}
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${
        accent === "emerald"
          ? "from-transparent via-emerald-500/40 to-transparent"
          : "from-transparent via-blue-500/40 to-transparent"
      }`} />

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-8">
        {/* Logo */}
        <Link href={isBiz ? "/biz/dashboard" : "/"} className="group flex flex-shrink-0 items-center gap-2.5">
          <div className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${
            accent === "emerald"
              ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20 group-hover:shadow-emerald-500/30"
              : "bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/20 group-hover:shadow-blue-500/30"
          }`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            {/* Glow ring */}
            <div className={`absolute -inset-0.5 rounded-xl opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-50 ${
              accent === "emerald" ? "bg-emerald-500" : "bg-blue-500"
            }`} />
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[17px] font-bold tracking-tight text-white">Rebookd</span>
            {isBizPage && (
              <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                Biz
              </span>
            )}
          </div>
        </Link>

        {/* Center navigation */}
        {status === "authenticated" && (
          <nav className="hidden flex-1 items-center justify-center md:flex">
            <div className="flex items-center gap-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-1 py-0.5">
              {isBiz ? (
                <>
                  <NavPill href="/biz/dashboard" active={pathname === "/biz/dashboard"} accent="emerald" icon={<Icons.Dashboard />}>Dashboard</NavPill>
                  <NavPill href="/biz/services" active={pathname === "/biz/services"} accent="emerald" icon={<Icons.Services />}>Services</NavPill>
                  <NavPill href="/biz/bookings" active={pathname === "/biz/bookings"} accent="emerald" icon={<Icons.Bookings />}>Bookings</NavPill>
                  <NavPill href="/biz/cancellations/new" active={pathname === "/biz/cancellations/new"} accent="emerald" icon={<Icons.Post />}>Post Deal</NavPill>
                  <NavPill href="/" active={false} accent="emerald" icon={<Icons.Feed />}>Feed</NavPill>
                </>
              ) : (
                <>
                  <NavPill href="/" active={pathname === "/"} accent="indigo" icon={<Icons.Deals />}>Deals</NavPill>
                  <NavPill href="/businesses" active={pathname === "/businesses"} accent="indigo" icon={<Icons.Nearby />}>Nearby</NavPill>
                  <NavPill href="/bookings" active={pathname === "/bookings"} accent="indigo" icon={<Icons.Bookings />}>Bookings</NavPill>
                  <NavPill href="/watchlist" active={pathname === "/watchlist"} accent="indigo" icon={<Icons.Watchlist />}>Watchlist</NavPill>
                  <NavPill href="/preferences" active={pathname === "/preferences"} accent="indigo" icon={<Icons.Preferences />}>Preferences</NavPill>
                </>
              )}
            </div>
          </nav>
        )}

        {/* Right side */}
        <div className="flex flex-shrink-0 items-center justify-end gap-3">
          {/* Search (Consumers only) */}
          {!isBiz && status === "authenticated" && (
            <div className="hidden w-48 lg:block xl:w-64">
              <SearchBar />
            </div>
          )}

          {status === "loading" ? (
            <div className="h-9 w-9 animate-pulse rounded-xl bg-white/[0.05]" />
          ) : status === "authenticated" ? (
            <>
              <NotificationBell />
              <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`group flex items-center gap-2.5 rounded-xl border py-1.5 pl-1.5 pr-3 transition-all duration-200 ${
                  menuOpen
                    ? "border-white/[0.12] bg-white/[0.08]"
                    : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.1] hover:bg-white/[0.06]"
                }`}
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-7 w-7 rounded-lg object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white ring-1 ring-white/10 ${
                    isBiz
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                      : "bg-gradient-to-br from-blue-500 to-cyan-600"
                  }`}>
                    {initials}
                  </div>
                )}
                <span className="hidden text-[13px] font-medium text-zinc-300 group-hover:text-white transition-colors sm:block">
                  {session.user.name?.split(" ")[0] || "Account"}
                </span>
                <span className={`text-zinc-500 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}>
                  <Icons.Chevron width={12} height={12} />
                </span>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 animate-in fade-in slide-in-from-top-1 zoom-in-95 duration-200">
                  {/* Glow effect behind dropdown */}
                  <div className={`absolute -inset-2 rounded-2xl opacity-20 blur-xl ${
                    accent === "emerald" ? "bg-emerald-500/20" : "bg-blue-500/20"
                  }`} />
                  <div className="relative rounded-2xl border border-white/[0.08] bg-[#141416]/95 backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden">
                    {/* User info */}
                    <div className="border-b border-white/[0.06] p-4">
                      <div className="flex items-center gap-3">
                        {session.user.image ? (
                          <img src={session.user.image} alt="" className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10" />
                        ) : (
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white ${
                            isBiz ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-blue-500 to-cyan-600"
                          }`}>{initials}</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{session.user.name || "User"}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{session.user.email}</p>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isBiz
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}>
                          <span className={`h-1 w-1 rounded-full ${isBiz ? "bg-emerald-400" : "bg-blue-400"}`} />
                          {session.user.role === "BUSINESS" ? "Business" : "Consumer"}
                        </span>
                      </div>
                    </div>

                    {/* Mobile nav links */}
                    <div className="border-b border-white/[0.06] p-1.5 md:hidden">
                      {isBiz ? (
                        <>
                          <DropdownLink href="/biz/dashboard" icon={<Icons.Dashboard />}>Dashboard</DropdownLink>
                          <DropdownLink href="/biz/services" icon={<Icons.Services />}>Services</DropdownLink>
                          <DropdownLink href="/biz/bookings" icon={<Icons.Bookings />}>Bookings</DropdownLink>
                          <DropdownLink href="/biz/cancellations/new" icon={<Icons.Post />}>Post Deal</DropdownLink>
                          <DropdownLink href="/" icon={<Icons.Feed />}>Browse Feed</DropdownLink>
                        </>
                      ) : (
                        <>
                          <DropdownLink href="/" icon={<Icons.Deals />}>Browse Deals</DropdownLink>
                          <DropdownLink href="/bookings" icon={<Icons.Bookings />}>My Bookings</DropdownLink>
                          <DropdownLink href="/watchlist" icon={<Icons.Watchlist />}>Watchlist</DropdownLink>
                          <DropdownLink href="/preferences" icon={<Icons.Preferences />}>Preferences</DropdownLink>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="p-1.5">
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Icons.SignOut />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="rounded-lg border border-white/10 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-all hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.97]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative">Sign up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ─── Nav pill for center navigation ───────────────────────────── */
function NavPill({
  href,
  active,
  accent,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  accent: "indigo" | "emerald";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const activeStyles = accent === "emerald"
    ? "bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10"
    : "bg-blue-500/15 text-blue-400 shadow-sm shadow-blue-500/10";
  const inactiveStyles = "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]";

  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all duration-200 ${
        active ? activeStyles : inactiveStyles
      }`}
    >
      <span className={`transition-colors ${active ? "" : "opacity-60"}`}>{icon}</span>
      {children}
    </Link>
  );
}

/* ─── Dropdown link with icon ──────────────────────────────────── */
function DropdownLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-all hover:bg-white/[0.06] hover:text-white"
    >
      <span className="text-zinc-500">{icon}</span>
      {children}
    </Link>
  );
}
