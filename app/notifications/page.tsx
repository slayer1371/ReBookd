"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: { cancellationId?: string; businessSlug?: string; discountPercent?: number } | null;
  read: boolean;
  sentAt: string;
}

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=50");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchNotifications();
  }, [status, router, fetchNotifications]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function typeIcon(type: string) {
    if (type === "NEW_CANCELLATION") return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      </div>
    );
    if (type === "BOOKING_CONFIRMED") return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-500/15 text-zinc-400">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0b]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="mt-1 text-sm text-zinc-500">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-blue-400 transition-colors hover:bg-white/[0.05]"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="mx-auto mb-3 h-12 w-12 text-zinc-700" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p className="text-zinc-500">No notifications yet</p>
            <p className="mt-1 text-sm text-zinc-600">
              Set your preferences and watchlist to get notified about new deals
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.data?.cancellationId ? `/deals/${n.data.cancellationId}` : "#"}
                onClick={() => { if (!n.read) markRead(n.id); }}
                className={`group flex items-start gap-4 rounded-xl border p-4 transition-all hover:border-white/[0.1] hover:bg-white/[0.03] ${
                  !n.read
                    ? "border-blue-500/20 bg-blue-500/[0.05]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                {typeIcon(n.type)}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-snug ${!n.read ? "font-medium text-white" : "text-zinc-300"}`}>
                    {n.title}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">{n.body}</p>
                  <p className="mt-2 text-xs text-zinc-600">{timeAgo(n.sentAt)}</p>
                </div>
                {!n.read && (
                  <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-400" />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
