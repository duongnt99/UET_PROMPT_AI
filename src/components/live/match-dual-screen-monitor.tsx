"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Expand, X } from "lucide-react";
import { Badge, Card } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { liveScreenWebSocketUrl, loadLiveScreenConfig, type LiveScreenConfig } from "@/lib/live-screen-client";
import { cn } from "@/lib/utils";

export type MatchScreenSide = {
  side: "A" | "B";
  registrationId: string;
  competitorName: string;
  preferredParticipantId: string;
  preferredParticipantName: string;
};

type Publisher = {
  sessionId: string;
  publisherConnectionId: string | null;
  participantId: string;
  participantName: string;
  slot: number;
  status: string;
  startedAt?: string;
  stream?: MediaStream;
};

function StreamVideo({ stream, className = "" }: { stream?: MediaStream; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream ?? null;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted className={className} />;
}

function PrimaryScreen({
  contestSessionId,
  screen,
  variant,
}: {
  contestSessionId: string;
  screen: MatchScreenSide;
  variant: "admin" | "overlay";
}) {
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [connection, setConnection] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [fullscreen, setFullscreen] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const configRef = useRef<LiveScreenConfig | null>(null);
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const unmountedRef = useRef(false);
  const connectRef = useRef<() => Promise<void>>(async () => undefined);

  const closePeer = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    pendingIceRef.current.clear();
    setPublisher((current) => current ? { ...current, stream: undefined } : null);
  }, []);

  const connect = useCallback(async () => {
    if (unmountedRef.current) return;
    try {
      const config = configRef.current ?? (await loadLiveScreenConfig());
      configRef.current = config;
      const socket = new WebSocket(liveScreenWebSocketUrl(config.websocketPath));
      socketRef.current = socket;
      const joinTimeout = setTimeout(() => {
        if (socket.readyState === WebSocket.OPEN) socket.close();
      }, 5_000);
      const send = (message: Record<string, unknown>) => {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
      };

      socket.onopen = () => {
        setConnection("connecting");
        send({ type: "viewer-join", contestSessionId, registrationId: screen.registrationId });
      };
      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as Record<string, unknown>;
        const type = String(message.type ?? "");
        if (type === "connected") {
          reconnectAttemptsRef.current = 0;
          return;
        }
        if (type === "viewer-snapshot") {
          clearTimeout(joinTimeout);
          setConnection("connected");
          const sessions = Array.isArray(message.publishers) ? message.publishers as Publisher[] : [];
          const primary = sessions.find((item) => String(item.participantId) === screen.preferredParticipantId);
          setPublisher(primary ? { ...primary, slot: Number(primary.slot) } : null);
          return;
        }
        if (type === "publisher-status") {
          if (String(message.participantId) !== screen.preferredParticipantId) return;
          const status = String(message.status);
          setPublisher((current) => ({
            sessionId: String(message.sessionId),
            publisherConnectionId: message.publisherConnectionId ? String(message.publisherConnectionId) : null,
            participantId: String(message.participantId),
            participantName: String(message.participantName || screen.preferredParticipantName),
            slot: Number(message.slot),
            status,
            startedAt: message.startedAt ? String(message.startedAt) : current?.startedAt,
            stream: status === "active" ? current?.stream : undefined,
          }));
          return;
        }
        if (type === "offer") {
          if (String(message.participantId) !== screen.preferredParticipantId) return;
          const sourceConnectionId = String(message.sourceConnectionId);
          closePeer();
          const peer = new RTCPeerConnection({ iceServers: config.iceServers });
          peerRef.current = peer;
          peer.onicecandidate = (iceEvent) => {
            if (iceEvent.candidate) {
              send({ type: "ice-candidate", targetConnectionId: sourceConnectionId, payload: iceEvent.candidate.toJSON() });
            }
          };
          peer.ontrack = (trackEvent) => {
            const stream = trackEvent.streams[0] ?? new MediaStream([trackEvent.track]);
            setPublisher((current) => ({
              sessionId: String(message.sessionId),
              publisherConnectionId: sourceConnectionId,
              participantId: String(message.participantId),
              participantName: String(message.participantName || screen.preferredParticipantName),
              slot: Number(message.slot),
              status: "active",
              startedAt: current?.startedAt,
              stream,
            }));
          };
          peer.onconnectionstatechange = () => {
            if (["disconnected", "failed", "closed"].includes(peer.connectionState)) {
              setPublisher((current) => current ? { ...current, status: "disconnected", stream: undefined } : null);
            }
          };
          void (async () => {
            await peer.setRemoteDescription(message.payload as RTCSessionDescriptionInit);
            for (const candidate of pendingIceRef.current.get(sourceConnectionId) ?? []) {
              await peer.addIceCandidate(candidate).catch(() => undefined);
            }
            pendingIceRef.current.delete(sourceConnectionId);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            send({ type: "answer", targetConnectionId: sourceConnectionId, payload: answer });
          })();
          return;
        }
        if (type === "ice-candidate") {
          if (String(message.participantId) !== screen.preferredParticipantId) return;
          const sourceConnectionId = String(message.sourceConnectionId);
          const candidate = message.payload as RTCIceCandidateInit;
          const peer = peerRef.current;
          if (peer?.remoteDescription) void peer.addIceCandidate(candidate).catch(() => undefined);
          else pendingIceRef.current.set(sourceConnectionId, [...(pendingIceRef.current.get(sourceConnectionId) ?? []), candidate]);
          return;
        }
        if (type === "error") {
          clearTimeout(joinTimeout);
          setConnection("disconnected");
        }
      };
      socket.onclose = () => {
        clearTimeout(joinTimeout);
        if (socketRef.current === socket) socketRef.current = null;
        closePeer();
        if (unmountedRef.current) return;
        setConnection("disconnected");
        const attempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = attempt;
        if (attempt <= 5) {
          reconnectTimerRef.current = setTimeout(() => void connectRef.current(), Math.min(500 * 2 ** (attempt - 1), 8_000));
        }
      };
      socket.onerror = () => socket.close();
    } catch {
      setConnection("disconnected");
    }
  }, [closePeer, contestSessionId, screen.preferredParticipantId, screen.preferredParticipantName, screen.registrationId]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    unmountedRef.current = false;
    const timer = setTimeout(() => void connect(), 0);
    return () => {
      unmountedRef.current = true;
      clearTimeout(timer);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
      peerRef.current?.close();
      peerRef.current = null;
    };
  }, [connect]);

  const isLive = publisher?.status === "active" && Boolean(publisher.stream);
  const connectionLabel = connection === "connected" ? "Đã kết nối" : connection === "connecting" ? "Đang kết nối" : "Mất kết nối";

  return (
    <Card className={cn("overflow-hidden p-0", variant === "overlay" && "border-white/20 bg-black/85 text-white shadow-2xl")}>
      <div className={cn("flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3", variant === "overlay" && "border-white/15")}>
        <div>
          <p className={cn("text-xs font-semibold uppercase tracking-wide text-slate-500", variant === "overlay" && "text-white/60")}>Đội {screen.side}</p>
          <h3 className="font-semibold">{screen.competitorName}</h3>
          <p className={cn("text-xs text-slate-500", variant === "overlay" && "text-white/60")}>Thí sinh: {screen.preferredParticipantName}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone={connection === "connected" ? "blue" : connection === "disconnected" ? "red" : "gold"}>{connectionLabel}</Badge>
          <Badge tone={isLive ? "green" : "slate"}>{isLive ? "LIVE" : "Chưa chia sẻ"}</Badge>
        </div>
      </div>
      <div className="relative flex aspect-video items-center justify-center bg-slate-950 text-sm text-slate-300">
        {publisher?.stream ? (
          <StreamVideo stream={publisher.stream} className="h-full w-full object-contain" />
        ) : (
          <p className="px-4 text-center">Đang chờ {screen.preferredParticipantName} chia sẻ màn hình</p>
        )}
        {publisher?.stream && variant === "admin" ? (
          <Button type="button" size="sm" variant="outline" className="absolute bottom-3 right-3" onClick={() => setFullscreen(true)}>
            <Expand className="h-4 w-4" /> Toàn màn hình
          </Button>
        ) : null}
      </div>
      {variant === "admin" && fullscreen && publisher?.stream ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black p-4">
          <div className="mb-3 flex items-center justify-between text-white">
            <p className="font-semibold">Đội {screen.side} · {screen.competitorName} · {publisher.participantName}</p>
            <Button type="button" variant="outline" onClick={() => setFullscreen(false)}>
              <X className="h-4 w-4" /> Trở lại hai màn hình
            </Button>
          </div>
          <StreamVideo stream={publisher.stream} className="min-h-0 flex-1 object-contain" />
        </div>
      ) : null}
    </Card>
  );
}

export function MatchDualScreenMonitor({
  contestSessionId,
  sides,
  variant = "admin",
}: {
  contestSessionId: string;
  sides: [MatchScreenSide, MatchScreenSide];
  variant?: "admin" | "overlay";
}) {
  return (
    <section className="space-y-3">
      {variant === "admin" ? (
        <div>
          <h2 className="text-xl font-semibold">Màn hình trực tiếp hai đội</h2>
          <p className="mt-1 text-sm text-slate-600">Theo dõi đồng thời thí sinh đầu tiên của Đội A và Đội B.</p>
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {sides.map((screen) => (
          <PrimaryScreen key={screen.side} contestSessionId={contestSessionId} screen={screen} variant={variant} />
        ))}
      </div>
    </section>
  );
}
