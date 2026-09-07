import { randomUUID } from "node:crypto";
import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import { getToken } from "next-auth/jwt";
import WebSocket, { WebSocketServer, type RawData } from "ws";
import { prisma } from "@/lib/db/prisma";
import { getEnv } from "@/config/env";
import {
  acquirePublisherSlot,
  databaseRolesToAppRoles,
  endPublisherSession,
  listLivePublisherSessions,
  setPublisherStatus,
  touchPublisherSession,
  validatePublisherAccess,
  validateViewerAccess,
} from "@/server/services/live-screen-service";
import type { Role } from "@/server/domain/permissions";

type PublisherState = {
  sessionId: string;
  contestSessionId: string;
  registrationId: string;
  participantId: string;
  slot: number;
  participantName: string;
  startedAt: string;
};
type ViewerState = { contestSessionId: string; registrationId: string };
type Connection = {
  id: string;
  ws: WebSocket;
  userId: string;
  roles: Role[];
  alive: boolean;
  publisher?: PublisherState;
  viewer?: ViewerState;
};

const MAX_MESSAGE_BYTES = 128 * 1024;

function send(connection: Connection, message: Record<string, unknown>) {
  if (connection.ws.readyState === WebSocket.OPEN) connection.ws.send(JSON.stringify(message));
}

function parseMessage(data: RawData): Record<string, unknown> | null {
  const text = data.toString();
  if (Buffer.byteLength(text) > MAX_MESSAGE_BYTES) return null;
  try {
    const value = JSON.parse(text) as unknown;
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function asString(value: unknown, max = 256): string {
  return typeof value === "string" && value.length > 0 && value.length <= max ? value : "";
}

export function attachLiveScreenSignaling(params: {
  server: HttpServer;
  handleNextUpgrade: (request: IncomingMessage, socket: Duplex, head: Buffer) => void;
}) {
  const env = getEnv();
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES });
  const connections = new Map<string, Connection>();
  const publisherConnectionBySession = new Map<string, string>();
  const releaseTimers = new Map<string, NodeJS.Timeout>();
  const allowedOrigins = new Set(
    (env.LIVE_SCREEN_ALLOWED_ORIGINS || new URL(env.APP_URL).origin)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

  function viewersFor(publisher: PublisherState) {
    return [...connections.values()].filter(
      (item) =>
        item.viewer?.contestSessionId === publisher.contestSessionId &&
        item.viewer.registrationId === publisher.registrationId,
    );
  }

  function broadcastPublisher(publisher: PublisherState, status: string) {
    for (const viewer of viewersFor(publisher)) {
      send(viewer, {
        type: "publisher-status",
        publisherConnectionId: publisherConnectionBySession.get(publisher.sessionId) ?? null,
        sessionId: publisher.sessionId,
        slot: publisher.slot,
        participantId: publisher.participantId,
        participantName: publisher.participantName,
        startedAt: publisher.startedAt,
        status,
      });
    }
  }

  async function stopPublisher(connection: Connection, status: "STOPPED" | "DISCONNECTED") {
    const publisher = connection.publisher;
    if (!publisher) return;
    connection.publisher = undefined;
    if (publisherConnectionBySession.get(publisher.sessionId) === connection.id) {
      publisherConnectionBySession.delete(publisher.sessionId);
    }
    const timer = releaseTimers.get(publisher.sessionId);
    if (timer) clearTimeout(timer);
    releaseTimers.delete(publisher.sessionId);
    const result = await endPublisherSession(publisher.sessionId, connection.id, status);
    if (result.count > 0) broadcastPublisher(publisher, status === "STOPPED" ? "stopped" : "disconnected");
  }

  function relationshipAllowed(sender: Connection, target: Connection) {
    if (sender.publisher && target.viewer) {
      return (
        sender.publisher.contestSessionId === target.viewer.contestSessionId &&
        sender.publisher.registrationId === target.viewer.registrationId
      );
    }
    if (sender.viewer && target.publisher) {
      return (
        sender.viewer.contestSessionId === target.publisher.contestSessionId &&
        sender.viewer.registrationId === target.publisher.registrationId
      );
    }
    return false;
  }

  async function onMessage(connection: Connection, data: RawData) {
    const message = parseMessage(data);
    if (!message) {
      send(connection, { type: "error", message: "Dữ liệu signaling không hợp lệ." });
      return;
    }
    const type = asString(message.type, 64);
    try {
      if (type === "publisher-register") {
        if (connection.viewer) throw new Error("Kết nối đang ở chế độ theo dõi.");
        const contestSessionId = asString(message.contestSessionId);
        if (!contestSessionId) throw new Error("Thiếu phiên thi.");
        const session = await acquirePublisherSlot({
          userId: connection.userId,
          contestSessionId,
          connectionId: connection.id,
          resumeSessionId: asString(message.resumeSessionId) || undefined,
        });
        const oldConnectionId = publisherConnectionBySession.get(session.id);
        const timer = releaseTimers.get(session.id);
        if (timer) clearTimeout(timer);
        releaseTimers.delete(session.id);
        connection.publisher = {
          sessionId: session.id,
          contestSessionId: session.contestSessionId,
          registrationId: session.registrationId,
          participantId: session.participantId,
          slot: session.slot,
          participantName: session.participantName,
          startedAt: session.startedAt.toISOString(),
        };
        publisherConnectionBySession.set(session.id, connection.id);
        if (oldConnectionId && oldConnectionId !== connection.id) {
          const old = connections.get(oldConnectionId);
          if (old) old.ws.close(4001, "Kết nối mới đã thay thế kết nối cũ.");
        }
        send(connection, {
          type: "publisher-registered",
          sessionId: session.id,
          slot: session.slot,
          participantName: session.participantName,
        });
        broadcastPublisher(connection.publisher, "connecting");
        for (const viewer of viewersFor(connection.publisher)) {
          send(connection, { type: "viewer-joined", viewerConnectionId: viewer.id });
        }
        return;
      }

      if (type === "publisher-ready") {
        if (!connection.publisher) throw new Error("Luồng chia sẻ chưa được đăng ký.");
        await setPublisherStatus(connection.publisher.sessionId, connection.id, "ACTIVE");
        broadcastPublisher(connection.publisher, "active");
        return;
      }

      if (type === "publisher-stop") {
        await stopPublisher(connection, "STOPPED");
        send(connection, { type: "publisher-stopped" });
        return;
      }

      if (type === "publisher-heartbeat") {
        if (!connection.publisher) return;
        try {
          await validatePublisherAccess({ userId: connection.userId, contestSessionId: connection.publisher.contestSessionId });
        } catch (error) {
          await stopPublisher(connection, "STOPPED");
          send(connection, { type: "error", message: error instanceof Error ? error.message : "Phiên thi đã kết thúc." });
          connection.ws.close(4003, "Quyền chia sẻ đã kết thúc.");
          return;
        }
        await touchPublisherSession(connection.publisher.sessionId, connection.id);
        return;
      }

      if (type === "viewer-join") {
        if (connection.publisher) throw new Error("Kết nối đang phát màn hình.");
        const contestSessionId = asString(message.contestSessionId);
        const registrationId = asString(message.registrationId) || asString(message.teamId);
        if (!registrationId) throw new Error("Thiếu hồ sơ dự thi.");
        await validateViewerAccess({ roles: connection.roles, contestSessionId, registrationId });
        connection.viewer = { contestSessionId, registrationId };
        const sessions = await listLivePublisherSessions(contestSessionId, registrationId);
        send(connection, {
          type: "viewer-snapshot",
          publishers: sessions.map((session) => ({
            sessionId: session.id,
            publisherConnectionId: publisherConnectionBySession.get(session.id) ?? null,
            slot: session.slot,
            participantId: session.participantId,
            participantName:
              session.participant.profile?.fullName || session.participant.name || session.participant.email,
            status: session.status.toLowerCase(),
            startedAt: session.startedAt.toISOString(),
          })),
        });
        for (const session of sessions) {
          const publisherConnectionId = publisherConnectionBySession.get(session.id);
          const publisher = publisherConnectionId ? connections.get(publisherConnectionId) : undefined;
          if (publisher) send(publisher, { type: "viewer-joined", viewerConnectionId: connection.id });
        }
        return;
      }

      if (["offer", "answer", "ice-candidate"].includes(type)) {
        const targetConnectionId = asString(message.targetConnectionId);
        const target = connections.get(targetConnectionId);
        if (!target || !relationshipAllowed(connection, target)) {
          throw new Error("Đích signaling không hợp lệ hoặc không được phép.");
        }
        const payload = message.payload;
        if (!payload || typeof payload !== "object") throw new Error("Payload signaling không hợp lệ.");
        send(target, {
          type,
          sourceConnectionId: connection.id,
          payload,
          sessionId: connection.publisher?.sessionId ?? target.publisher?.sessionId,
          slot: connection.publisher?.slot ?? target.publisher?.slot,
          participantId: connection.publisher?.participantId ?? target.publisher?.participantId,
          participantName: connection.publisher?.participantName ?? target.publisher?.participantName,
        });
        return;
      }

      if (type === "viewer-left") {
        connection.viewer = undefined;
        return;
      }

      throw new Error("Loại signaling không được hỗ trợ.");
    } catch (error) {
      send(connection, { type: "error", message: error instanceof Error ? error.message : "Không xử lý được signaling." });
    }
  }

  function handleConnection(ws: WebSocket, auth: { userId: string; roles: Role[] }) {
    const connection: Connection = {
      id: randomUUID(),
      ws,
      userId: auth.userId,
      roles: auth.roles,
      alive: true,
    };
    connections.set(connection.id, connection);
    send(connection, { type: "connected", connectionId: connection.id });
    ws.on("pong", () => {
      connection.alive = true;
    });
    ws.on("message", (data) => void onMessage(connection, data));
    ws.on("close", () => {
      connections.delete(connection.id);
      if (connection.publisher) {
        const publisher = connection.publisher;
        if (publisherConnectionBySession.get(publisher.sessionId) !== connection.id) return;
        void setPublisherStatus(publisher.sessionId, connection.id, "RECONNECTING");
        broadcastPublisher(publisher, "reconnecting");
        const timer = setTimeout(() => void stopPublisher(connection, "DISCONNECTED"), env.LIVE_SCREEN_DISCONNECT_GRACE_SECONDS * 1_000);
        releaseTimers.set(publisher.sessionId, timer);
      }
    });
  }

  const heartbeat = setInterval(() => {
    for (const connection of connections.values()) {
      if (!connection.alive) {
        connection.ws.terminate();
        continue;
      }
      connection.alive = false;
      connection.ws.ping();
    }
  }, 30_000);
  let authorizationSweepRunning = false;
  const authorizationSweep = setInterval(() => {
    if (authorizationSweepRunning) return;
    authorizationSweepRunning = true;
    void (async () => {
      for (const connection of [...connections.values()]) {
        try {
          if (connection.publisher) {
            await validatePublisherAccess({
              userId: connection.userId,
              contestSessionId: connection.publisher.contestSessionId,
            });
          } else if (connection.viewer) {
            const user = await prisma.user.findUnique({
              where: { id: connection.userId },
              include: { roleAssignments: { where: { revokedAt: null } } },
            });
            if (!user || user.status !== "ACTIVE" || user.deletedAt) throw new Error("Tài khoản không còn quyền truy cập.");
            connection.roles = databaseRolesToAppRoles(user.roleAssignments.map((item) => item.role));
            await validateViewerAccess({
              roles: connection.roles,
              contestSessionId: connection.viewer.contestSessionId,
              registrationId: connection.viewer.registrationId,
            });
          }
        } catch (error) {
          if (connection.publisher) await stopPublisher(connection, "STOPPED");
          send(connection, { type: "error", message: error instanceof Error ? error.message : "Quyền truy cập đã kết thúc." });
          connection.ws.close(4003, "Quyền truy cập đã kết thúc.");
        }
      }
    })().finally(() => {
      authorizationSweepRunning = false;
    });
  }, 15_000);
  wss.on("close", () => {
    clearInterval(heartbeat);
    clearInterval(authorizationSweep);
  });
  params.server.on("close", () => wss.close());

  params.server.on("upgrade", async (request, socket, head) => {
    const pathname = new URL(request.url ?? "/", env.APP_URL).pathname;
    if (pathname !== "/api/live-screen/socket") {
      params.handleNextUpgrade(request, socket, head);
      return;
    }
    try {
      const origin = request.headers.origin;
      if (!origin || !allowedOrigins.has(origin)) throw new Error("Origin không được phép.");
      const headers = Object.fromEntries(
        Object.entries(request.headers)
          .filter((entry): entry is [string, string | string[]] => entry[1] !== undefined)
          .map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : value]),
      );
      const token = await getToken({
        req: { headers },
        secret: env.AUTH_SECRET,
        secureCookie: env.APP_URL.startsWith("https://"),
      });
      const userId = typeof token?.userId === "string" ? token.userId : "";
      if (!userId) throw new Error("Chưa đăng nhập.");
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { roleAssignments: { where: { revokedAt: null } } },
      });
      if (!user || user.status !== "ACTIVE" || user.deletedAt) throw new Error("Tài khoản không hợp lệ.");
      const roles = databaseRolesToAppRoles(user.roleAssignments.map((item) => item.role));
      wss.handleUpgrade(request, socket, head, (ws) => {
        handleConnection(ws, { userId, roles });
      });
    } catch {
      socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
      socket.destroy();
    }
  });
}
