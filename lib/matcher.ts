/**
 * Matching Engine
 *
 * When a new cancellation is posted, find users who should be notified:
 *  1. Users whose category preferences include this category AND are within range
 *  2. Users who are watching this business (Watchlist)
 *
 * Creates Notification records and pushes live SSE events.
 */

import { prisma } from "@/lib/prisma";
import { sseManager } from "@/lib/sse";
import { sendWatchlistNotification } from "@/lib/email";

interface CancellationForMatching {
  id: string;
  businessId: string;
  discountPercent: number;
  discountedPrice: number;
  originalStartTime: Date;
  service: { name: string; category: string; originalPrice: string | number };
  business: { name: string; slug: string; category: string; lat: number; lng: number };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function notifyMatchingUsers(cancellation: CancellationForMatching) {
  try {
    const bizLat = cancellation.business.lat;
    const bizLng = cancellation.business.lng;
    const category = cancellation.business.category;

    // 1. Find users with matching category preference (Explicit YES or Default YES)
    const matchedUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            role: { not: "BUSINESS" }, // Explicitly exclude business role
          },
          {
            role: null, // Include users with no role (though they should be redirected)
          },
        ],
        AND: [
          {
            OR: [
              {
                preferences: {
                  some: {
                    category: category as never,
                    enabled: true,
                  },
                },
              },
              {
                preferences: {
                  none: {
                    category: category as never,
                  },
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        lat: true,
        lng: true,
        searchRadius: true,
      },
    });

    // Filter by distance
    const matchedUserIds = new Set<string>();
    for (const user of matchedUsers) {
      if (user.lat != null && user.lng != null) {
        const dist = haversineKm(user.lat, user.lng, bizLat, bizLng);
        if (dist <= user.searchRadius) {
          matchedUserIds.add(user.id);
        }
      } else {
        // Users without location set — include them (they see all)
        matchedUserIds.add(user.id);
      }
    }

    // 2. Find watchlist users for this business
    const watchers = await prisma.watchlist.findMany({
      where: { businessId: cancellation.businessId },
      include: { 
        user: { select: { id: true, email: true } } 
      },
    });
    
    for (const w of watchers) {
      matchedUserIds.add(w.userId);
      
      // Send email to watchers
      if (w.user.email) {
        sendWatchlistNotification({
          to: w.user.email,
          businessName: cancellation.business.name,
          serviceName: cancellation.service.name,
          discountPercent: cancellation.discountPercent,
          discountedPrice: cancellation.discountedPrice,
          originalPrice: cancellation.service.originalPrice,
          dealUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/deals/${cancellation.id}`,
        });
      }
    }

    if (matchedUserIds.size === 0) return;

    // 3. Create notifications in bulk
    const title = `${cancellation.discountPercent}% off at ${cancellation.business.name}`;
    const body = `${cancellation.service.name} — $${cancellation.discountedPrice} (was $${cancellation.service.originalPrice})`;
    const data = {
      cancellationId: cancellation.id,
      businessSlug: cancellation.business.slug,
      discountPercent: cancellation.discountPercent,
    };

    const userIdArray = Array.from(matchedUserIds);

    await prisma.notification.createMany({
      data: userIdArray.map((userId) => ({
        userId,
        type: "NEW_CANCELLATION" as const,
        title,
        body,
        data,
      })),
    });

    // 4. Push live SSE events to connected clients
    const notificationPayload = { title, body, data, type: "NEW_CANCELLATION" };
    sseManager.sendToUsers(userIdArray, "notification", notificationPayload);

    // 5. Broadcast feed-update to ALL connected clients so feeds refresh
    sseManager.broadcast("feed-update", {
      action: "new-cancellation",
      cancellationId: cancellation.id,
    });

    console.log(
      `[Matcher] Notified ${matchedUserIds.size} users for cancellation ${cancellation.id}`
    );
  } catch (error) {
    // Don't let notification failures break the cancellation flow
    console.error("[Matcher] Error notifying users:", error);
  }
}
