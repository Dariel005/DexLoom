import { getAdminOverview } from "@/lib/analytics-service";
import { getServerAuthUser } from "@/lib/auth-session";
import { getAdminUsersPayload } from "@/lib/role-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeSse(event: string, data: unknown) {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(request: Request) {
  const user = await getServerAuthUser();
  if (!user) {
    return new Response("Unauthorized.", { status: 401 });
  }

  if (!user.permissions.accessAdmin) {
    return new Response("Forbidden.", { status: 403 });
  }

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let sending = false;
      let intervalId: NodeJS.Timeout | null = null;

      const close = () => {
        if (closed) {
          return;
        }
        closed = true;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        try {
          controller.close();
        } catch {
          // Stream may already be closed by the runtime.
        }
      };

      const send = (event: string, data: unknown) => {
        if (closed) {
          return;
        }
        controller.enqueue(encodeSse(event, data));
      };

      const pushSnapshot = async () => {
        if (closed || sending) {
          return;
        }

        sending = true;
        try {
          const [overview, users] = await Promise.all([getAdminOverview(), getAdminUsersPayload()]);
          send("overview", overview);
          send("users", users);
          send("heartbeat", { at: new Date().toISOString() });
        } catch (error) {
          send("stream-error", {
            message: error instanceof Error ? error.message : "Unable to refresh admin stream."
          });
        } finally {
          sending = false;
        }
      };

      request.signal.addEventListener("abort", close);
      send("ready", { at: new Date().toISOString() });
      void pushSnapshot();
      intervalId = setInterval(() => {
        void pushSnapshot();
      }, 10_000);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
