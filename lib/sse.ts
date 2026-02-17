/**
 * SSE (Server-Sent Events) Manager
 *
 * In-memory registry of connected clients.  When a notification or feed event
 * is created we push it to every connected writer for that user.
 *
 * NOTE: This is a single-process solution.  For multi-instance deployments
 * you'd swap the Map for Redis pub/sub.
 */

type SSEWriter = WritableStreamDefaultWriter<Uint8Array>;

interface ClientEntry {
  writer: SSEWriter;
  controller: ReadableStreamDefaultController<Uint8Array>;
}

class SSEManager {
  // userId → set of open connections
  private clients = new Map<string, Set<ClientEntry>>();

  /** Register a new SSE client connection */
  addClient(userId: string, entry: ClientEntry) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(entry);
  }

  /** Remove a disconnected client */
  removeClient(userId: string, entry: ClientEntry) {
    const set = this.clients.get(userId);
    if (set) {
      set.delete(entry);
      if (set.size === 0) this.clients.delete(userId);
    }
  }

  /** Send an SSE event to a specific user (all their open tabs) */
  sendToUser(userId: string, event: string, data: unknown) {
    const set = this.clients.get(userId);
    if (!set || set.size === 0) return;

    const encoder = new TextEncoder();
    const payload = encoder.encode(
      `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    );

    for (const entry of set) {
      try {
        entry.controller.enqueue(payload);
      } catch {
        // Client disconnected — clean up
        this.removeClient(userId, entry);
      }
    }
  }

  /** Send an event to multiple users at once */
  sendToUsers(userIds: string[], event: string, data: unknown) {
    for (const uid of userIds) {
      this.sendToUser(uid, event, data);
    }
  }

  /** Broadcast to ALL connected clients (e.g. feed updates) */
  broadcast(event: string, data: unknown) {
    for (const [userId] of this.clients) {
      this.sendToUser(userId, event, data);
    }
  }

  /** Get count of connected clients (for debugging) */
  get connectedUsers(): number {
    return this.clients.size;
  }
}

// Singleton — survives hot reloads in dev
const globalForSSE = globalThis as unknown as { sseManager?: SSEManager };
export const sseManager = globalForSSE.sseManager ?? new SSEManager();
if (process.env.NODE_ENV !== "production") globalForSSE.sseManager = sseManager;
