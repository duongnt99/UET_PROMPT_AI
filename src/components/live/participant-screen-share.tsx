"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MonitorUp, RefreshCw, Square } from "lucide-react";
import { toast } from "sonner";
import { Badge, Card } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  liveScreenWebSocketUrl,
  loadLiveScreenConfig,
  vietnameseShareError,
  type LiveScreenConfig,
} from "@/lib/live-screen-client";

type ShareStatus = "idle" | "connecting" | "sharing" | "disconnected" | "reconnecting" | "stopped";

const LABELS: Record<ShareStatus, string> = {
  idle: "Chưa chia sẻ",
  connecting: "Đang kết nối",
  sharing: "Đang chia sẻ màn hình",
  disconnected: "Mất kết nối",
  reconnecting: "Đang kết nối lại",
  stopped: "Đã dừng",
};

export function ParticipantScreenShare({
  contestSessionId,
  canShare,
}: {
  contestSessionId: string;
  canShare: boolean;
}) {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const [slot, setSlot] = useState<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const configRef = useRef<LiveScreenConfig | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const intentionallyStoppedRef = useRef(false);
  const connectRef = useRef<() => Promise<void>>(async () => undefined);

  const closePeers = useCallback(() => {
    for (const peer of peersRef.current.values()) peer.close();
    peersRef.current.clear();
    pendingIceRef.current.clear();
  }, []);

  const cleanup = useCallback((stopTracks: boolean) => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    reconnectTimerRef.current = null;
    heartbeatRef.current = null;
    closePeers();
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      if (socket.readyState <= WebSocket.OPEN) socket.close();
    }
    if (stopTracks) {
      for (const track of streamRef.current?.getTracks() ?? []) {
        track.onended = null;
        track.stop();
      }
      streamRef.current = null;
    }
  }, [closePeers]);

  const send = useCallback((message: Record<string, unknown>) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  const createOfferForViewer = useCallback(async (viewerConnectionId: string) => {
    const stream = streamRef.current;
    const config = configRef.current;
    if (!stream || !config) return;
    peersRef.current.get(viewerConnectionId)?.close();
    const peer = new RTCPeerConnection({ iceServers: config.iceServers });
    peersRef.current.set(viewerConnectionId, peer);
    for (const track of stream.getTracks()) peer.addTrack(track, stream);
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        send({ type: "ice-candidate", targetConnectionId: viewerConnectionId, payload: event.candidate.toJSON() });
      }
    };
    peer.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(peer.connectionState)) {
        peer.close();
        peersRef.current.delete(viewerConnectionId);
      }
      if (peer.connectionState === "disconnected") setStatus("disconnected");
      if (peer.connectionState === "connected") setStatus("sharing");
    };
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    send({ type: "offer", targetConnectionId: viewerConnectionId, payload: offer });
  }, [send]);

  const connect = useCallback(async () => {
    if (!streamRef.current || intentionallyStoppedRef.current) return;
    try {
      const config = configRef.current ?? (await loadLiveScreenConfig());
      configRef.current = config;
      const socket = new WebSocket(liveScreenWebSocketUrl(config.websocketPath));
      socketRef.current = socket;
      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as Record<string, unknown>;
        const type = String(message.type ?? "");
        if (type === "connected") {
          send({
            type: "publisher-register",
            contestSessionId,
            resumeSessionId: sessionIdRef.current,
          });
        } else if (type === "publisher-registered") {
          sessionIdRef.current = String(message.sessionId);
          setSlot(Number(message.slot));
          setStatus("sharing");
          reconnectAttemptsRef.current = 0;
          send({ type: "publisher-ready" });
          if (heartbeatRef.current) clearInterval(heartbeatRef.current);
          heartbeatRef.current = setInterval(() => send({ type: "publisher-heartbeat" }), 10_000);
        } else if (type === "viewer-joined") {
          void createOfferForViewer(String(message.viewerConnectionId));
        } else if (type === "answer") {
          const viewerConnectionId = String(message.sourceConnectionId);
          const peer = peersRef.current.get(viewerConnectionId);
          if (peer) void (async () => {
            await peer.setRemoteDescription(message.payload as RTCSessionDescriptionInit);
            for (const candidate of pendingIceRef.current.get(viewerConnectionId) ?? []) {
              await peer.addIceCandidate(candidate).catch(() => undefined);
            }
            pendingIceRef.current.delete(viewerConnectionId);
          })();
        } else if (type === "ice-candidate") {
          const viewerConnectionId = String(message.sourceConnectionId);
          const peer = peersRef.current.get(viewerConnectionId);
          const candidate = message.payload as RTCIceCandidateInit;
          if (peer?.remoteDescription) void peer.addIceCandidate(candidate).catch(() => undefined);
          else pendingIceRef.current.set(viewerConnectionId, [...(pendingIceRef.current.get(viewerConnectionId) ?? []), candidate]);
        } else if (type === "error") {
          const errorMessage = String(message.message || "Không thể chia sẻ màn hình.");
          toast.error(errorMessage);
          if (!sessionIdRef.current) {
            intentionallyStoppedRef.current = true;
            cleanup(true);
            setStatus("stopped");
          }
        }
      };
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
        closePeers();
        if (intentionallyStoppedRef.current || !streamRef.current) return;
        const attempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = attempt;
        if (attempt > 5) {
          setStatus("disconnected");
          toast.error("Không thể kết nối lại máy chủ chia sẻ màn hình.");
          cleanup(true);
          return;
        }
        setStatus("reconnecting");
        reconnectTimerRef.current = setTimeout(() => void connectRef.current(), Math.min(500 * 2 ** (attempt - 1), 8_000));
      };
      socket.onerror = () => socket.close();
    } catch (error) {
      setStatus("disconnected");
      toast.error(vietnameseShareError(error));
      cleanup(true);
    }
  }, [cleanup, closePeers, contestSessionId, createOfferForViewer, send]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const stopSharing = useCallback(() => {
    intentionallyStoppedRef.current = true;
    send({ type: "publisher-stop" });
    cleanup(true);
    sessionIdRef.current = null;
    setSlot(null);
    setStatus("stopped");
  }, [cleanup, send]);

  const attachNativeStop = useCallback((stream: MediaStream) => {
    const track = stream.getVideoTracks()[0];
    if (track) track.onended = () => stopSharing();
  }, [stopSharing]);

  const startSharing = useCallback(async () => {
    if (!canShare) {
      toast.error("Thí sinh hiện không trong thời gian được phép chia sẻ màn hình.");
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast.error("Trình duyệt này không hỗ trợ chia sẻ màn hình.");
      return;
    }
    try {
      setStatus("connecting");
      intentionallyStoppedRef.current = false;
      reconnectAttemptsRef.current = 0;
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      attachNativeStop(stream);
      await connect();
    } catch (error) {
      setStatus("idle");
      toast.error(vietnameseShareError(error));
    }
  }, [attachNativeStop, canShare, connect]);

  const changeScreen = useCallback(async () => {
    try {
      const nextStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const nextTrack = nextStream.getVideoTracks()[0];
      if (!nextTrack) throw new Error("Không nhận được hình ảnh màn hình.");
      for (const peer of peersRef.current.values()) {
        const sender = peer.getSenders().find((item) => item.track?.kind === "video");
        if (sender) await sender.replaceTrack(nextTrack);
      }
      for (const track of streamRef.current?.getTracks() ?? []) {
        track.onended = null;
        track.stop();
      }
      streamRef.current = nextStream;
      attachNativeStop(nextStream);
      toast.success("Đã thay đổi màn hình chia sẻ.");
    } catch (error) {
      toast.error(vietnameseShareError(error));
    }
  }, [attachNativeStop]);

  useEffect(() => () => {
    intentionallyStoppedRef.current = true;
    send({ type: "publisher-stop" });
    cleanup(true);
  }, [cleanup, send]);

  const active = ["connecting", "sharing", "disconnected", "reconnecting"].includes(status);
  return (
    <Card className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Chia sẻ màn hình thi</h2>
            <Badge tone={status === "sharing" ? "green" : status === "disconnected" ? "red" : "slate"}>
              {LABELS[status]}{slot ? ` · Màn hình ${slot}` : ""}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">Chỉ chia sẻ màn hình bạn chọn; camera và microphone không được bật.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!active ? (
            <Button type="button" onClick={() => void startSharing()} disabled={!canShare}>
              <MonitorUp className="h-4 w-4" /> Chia sẻ màn hình
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => void changeScreen()} disabled={status !== "sharing"}>
                <RefreshCw className="h-4 w-4" /> Thay đổi màn hình
              </Button>
              <Button type="button" variant="destructive" onClick={stopSharing}>
                <Square className="h-4 w-4" /> Dừng chia sẻ
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
