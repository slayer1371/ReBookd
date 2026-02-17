import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sseManager } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/notifications/stream — SSE endpoint for real-time notifications
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial heartbeat
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Register with SSE manager
      const entry = { writer: null as never, controller };
      sseManager.addClient(userId, entry);

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          sseManager.removeClient(userId, entry);
        }
      }, 30000);

      // Clean up when the client disconnects
      // The controller.close / cancel is called when the Response is aborted
    },
    cancel() {
      // Stream cancelled by client disconnect — cleanup handled by heartbeat failure
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
