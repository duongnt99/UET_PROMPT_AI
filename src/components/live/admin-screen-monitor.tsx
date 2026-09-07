"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Expand, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Card, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { liveScreenWebSocketUrl, loadLiveScreenConfig, type LiveScreenConfig } from "@/lib/live-screen-client";
import { addLiveCommentAction } from "@/server/actions/live-screen-actions";

type Publisher = {
  sessionId: string;
  publisherConnectionId: string | null;
  slot: 1 | 2;
  participantName: string;
  status: string;
  startedAt?: string;
  stream?: MediaStream;
};
type Comment = { id: string; content: string; authorName: string; createdAt: string };

function StreamVideo({ stream, className = "" }: { stream?: MediaStream; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream ?? null;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted className={className} />;
}

function statusLabel(status: string) {
  if (status === "active") return "Đang trực tiếp";
  if (status === "connecting") return "Đang kết nối";
  if (status === "reconnecting") return "Đang kết nối lại";
  if (status === "disconnected") return "Mất kết nối";
  if (status === "stopped") return "Đã dừng";
  return "Chưa chia sẻ màn hình";
}

export function AdminScreenMonitor({
  contestSessionId,
  registrationId,
  competitorName,
  initialComments,
}: {
  contestSessionId: string;
  registrationId: string;
  competitorName: string;
  initialComments: Comment[];
}) {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [serverStatus, setServerStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [fullscreenSlot, setFullscreenSlot] = useState<1 | 2 | null>(null);
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState("");
  const [pending, startTransition] = useTransition();
  const socketRef = useRef<WebSocket | null>(null);
  const configRef = useRef<LiveScreenConfig | null>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const unmountedRef = useRef(false);
  const connectRef = useRef<() => Promise<void>>(async () => undefined);

  const send = useCallback((message: Record<string, unknown>) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify(message));
  }, []);

  const closePeers = useCallback(() => {
    for (const peer of peersRef.current.values()) peer.close();
    peersRef.current.clear();
    pendingIceRef.current.clear();
    setPublishers((current) => current.map((publisher) => ({ ...publisher, stream: undefined })));
  }, []);

  const updatePublisher = useCallback((next: Publisher) => {
    setPublishers((current) => {
      const previous = current.find((item) => item.sessionId === next.sessionId);
      const without = current.filter((item) => item.sessionId !== next.sessionId && item.slot !== next.slot);
      return [...without, { ...previous, ...next, startedAt: next.startedAt ?? previous?.startedAt }].sort((a, b) => a.slot - b.slot);
    });
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
      socket.onopen = () => {
        setServerStatus("connecting");
        socket.send(JSON.stringify({ type: "viewer-join", contestSessionId, registrationId }));
      };
      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as Record<string, unknown>;
        const type = String(message.type ?? "");
        if (type === "connected") {
          reconnectAttemptsRef.current = 0;
        } else if (type === "viewer-snapshot") {
          clearTimeout(joinTimeout);
          setServerStatus("connected");
          const list = Array.isArray(message.publishers) ? (message.publishers as Publisher[]) : [];
          setPublishers(list.map((item) => ({ ...item, slot: Number(item.slot) as 1 | 2 })));
        } else if (type === "publisher-status") {
          const slot = Number(message.slot) as 1 | 2;
          const status = String(message.status);
          setPublishers((current) => {
            const existing = current.find((item) => item.sessionId === String(message.sessionId));
            const next: Publisher = {
              sessionId: String(message.sessionId),
              publisherConnectionId: message.publisherConnectionId ? String(message.publisherConnectionId) : null,
              slot,
              participantName: String(message.participantName || existing?.participantName || `Màn hình ${slot}`),
              status,
              startedAt: message.startedAt ? String(message.startedAt) : existing?.startedAt,
              stream: status === "active" ? existing?.stream : undefined,
            };
            return [...current.filter((item) => item.sessionId !== next.sessionId && item.slot !== slot), next].sort(
              (a, b) => a.slot - b.slot,
            );
          });
        } else if (type === "offer") {
          const publisherConnectionId = String(message.sourceConnectionId);
          const sessionId = String(message.sessionId);
          const slot = Number(message.slot) as 1 | 2;
          const participantName = String(message.participantName || `Màn hình ${slot}`);
          const old = peersRef.current.get(publisherConnectionId);
          old?.close();
          const peer = new RTCPeerConnection({ iceServers: config.iceServers });
          peersRef.current.set(publisherConnectionId, peer);
          peer.onicecandidate = (iceEvent) => {
            if (iceEvent.candidate) {
              send({ type: "ice-candidate", targetConnectionId: publisherConnectionId, payload: iceEvent.candidate.toJSON() });
            }
          };
          peer.ontrack = (trackEvent) => {
            const stream = trackEvent.streams[0] ?? new MediaStream([trackEvent.track]);
            updatePublisher({
              sessionId,
              publisherConnectionId,
              slot,
              participantName,
              status: "active",
              stream,
            });
          };
          peer.onconnectionstatechange = () => {
            if (["disconnected", "failed", "closed"].includes(peer.connectionState)) {
              setPublishers((current) =>
                current.map((item) =>
                  item.sessionId === sessionId
                    ? { ...item, status: peer.connectionState === "disconnected" ? "reconnecting" : "disconnected", stream: undefined }
                    : item,
                ),
              );
            }
          };
          void (async () => {
            await peer.setRemoteDescription(message.payload as RTCSessionDescriptionInit);
            for (const candidate of pendingIceRef.current.get(publisherConnectionId) ?? []) {
              await peer.addIceCandidate(candidate).catch(() => undefined);
            }
            pendingIceRef.current.delete(publisherConnectionId);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            send({ type: "answer", targetConnectionId: publisherConnectionId, payload: answer });
          })().catch(() => toast.error("Không thiết lập được kết nối màn hình."));
        } else if (type === "ice-candidate") {
          const publisherConnectionId = String(message.sourceConnectionId);
          const peer = peersRef.current.get(publisherConnectionId);
          const candidate = message.payload as RTCIceCandidateInit;
          if (peer?.remoteDescription) void peer.addIceCandidate(candidate).catch(() => undefined);
          else pendingIceRef.current.set(publisherConnectionId, [...(pendingIceRef.current.get(publisherConnectionId) ?? []), candidate]);
        } else if (type === "error") {
          clearTimeout(joinTimeout);
          setServerStatus("disconnected");
          toast.error(String(message.message || "Không thể theo dõi màn hình."));
        }
      };
      socket.onclose = () => {
        clearTimeout(joinTimeout);
        if (socketRef.current === socket) socketRef.current = null;
        closePeers();
        if (unmountedRef.current) return;
        setServerStatus("disconnected");
        const attempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = attempt;
        if (attempt > 5) {
          toast.error("Mất kết nối máy chủ signaling. Hãy tải lại trang để thử lại.");
          return;
        }
        reconnectTimerRef.current = setTimeout(() => void connectRef.current(), Math.min(500 * 2 ** (attempt - 1), 8_000));
      };
      socket.onerror = () => socket.close();
    } catch (error) {
      setServerStatus("disconnected");
      toast.error(error instanceof Error ? error.message : "Không kết nối được máy chủ signaling.");
    }
  }, [closePeers, contestSessionId, registrationId, send, updatePublisher]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    unmountedRef.current = false;
    const peers = peersRef.current;
    const initialConnectTimer = setTimeout(() => void connect(), 0);
    return () => {
      unmountedRef.current = true;
      clearTimeout(initialConnectTimer);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      send({ type: "viewer-left" });
      const socket = socketRef.current;
      socketRef.current = null;
      socket?.close();
      for (const peer of peers.values()) peer.close();
      peers.clear();
    };
  }, [connect, send]);

  useEffect(() => {
    if (fullscreenSlot == null) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreenSlot(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [fullscreenSlot]);

  function submitComment() {
    const content = commentText.trim();
    if (!content) return;
    startTransition(async () => {
      const result = await addLiveCommentAction({ contestSessionId, registrationId, content });
      if (!result.ok || !result.comment) {
        toast.error(result.message);
        return;
      }
      setComments((current) => [...current, result.comment!]);
      setCommentText("");
      toast.success(result.message);
    });
  }

  const cards = ([1, 2] as const).map((screenSlot) => {
    const publisher = publishers.find((item) => item.slot === screenSlot);
    return (
      <Card key={screenSlot} className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <p className="font-semibold">{publisher?.participantName || `Màn hình ${screenSlot}`}</p>
            <p className="text-xs text-slate-500">Màn hình {screenSlot}</p>
          </div>
          <Badge tone={publisher?.status === "active" ? "green" : publisher?.status === "disconnected" ? "red" : "slate"}>
            {publisher?.status === "active" ? "LIVE" : statusLabel(publisher?.status ?? "")}
          </Badge>
        </div>
        <div className="relative flex aspect-video items-center justify-center bg-slate-950 text-sm text-slate-300">
          {publisher?.stream ? (
            <StreamVideo stream={publisher.stream} className="h-full w-full object-contain" />
          ) : (
            <p>{statusLabel(publisher?.status ?? "")}</p>
          )}
          {publisher?.stream ? (
            <Button type="button" size="sm" variant="outline" className="absolute bottom-3 right-3" onClick={() => setFullscreenSlot(screenSlot)}>
              <Expand className="h-4 w-4" /> Toàn màn hình
            </Button>
          ) : null}
        </div>
        {publisher?.startedAt ? (
          <p className="px-4 py-2 text-xs text-slate-500">Bắt đầu: {new Date(publisher.startedAt).toLocaleString("vi-VN")}</p>
        ) : null}
      </Card>
    );
  });

  const fullscreenPublisher = publishers.find((item) => item.slot === fullscreenSlot);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-3xl">Theo dõi màn hình · {competitorName}</h1>
          <p className="mt-1 text-sm text-slate-600">Tối đa 2 màn hình trực tiếp trong phiên thi này.</p>
        </div>
        <Badge tone={serverStatus === "connected" ? "green" : serverStatus === "disconnected" ? "red" : "gold"}>
          {serverStatus === "connected" ? "Signaling đã kết nối" : serverStatus === "connecting" ? "Đang kết nối signaling" : "Mất kết nối signaling"}
        </Badge>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{cards}</div>

      <Card>
        <h2 className="font-semibold">MC / Bình luận nội bộ</h2>
        <p className="mt-1 text-sm text-slate-600">Chỉ Ban Tổ chức và kỹ thuật thấy nội dung này.</p>
        <div className="mt-4 max-h-72 space-y-3 overflow-y-auto">
          {comments.length ? comments.map((comment) => (
            <div key={comment.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="text-xs text-slate-500">
                {new Date(comment.createdAt).toLocaleString("vi-VN")} · {comment.authorName}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{comment.content}</p>
            </div>
          )) : <p className="text-sm text-slate-500">Chưa có bình luận.</p>}
        </div>
        <div className="mt-4 space-y-2">
          <Textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Nhập bình luận hoặc ghi chú của MC…" maxLength={2_000} />
          <Button type="button" onClick={submitComment} disabled={pending || !commentText.trim()}>
            {pending ? "Đang lưu…" : "Gửi bình luận"}
          </Button>
        </div>
      </Card>

      {fullscreenSlot && fullscreenPublisher?.stream ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black p-4">
          <div className="mb-3 flex items-center justify-between text-white">
            <p className="font-semibold">{fullscreenPublisher.participantName} · Màn hình {fullscreenSlot}</p>
            <Button type="button" variant="outline" onClick={() => setFullscreenSlot(null)}>
              <X className="h-4 w-4" /> Quay lại 2 màn hình
            </Button>
          </div>
          <StreamVideo stream={fullscreenPublisher.stream} className="min-h-0 flex-1 object-contain" />
        </div>
      ) : null}
    </div>
  );
}
