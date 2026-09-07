export type LiveScreenConfig = {
  iceServers: RTCIceServer[];
  websocketPath: string;
};

export async function loadLiveScreenConfig(): Promise<LiveScreenConfig> {
  const response = await fetch("/api/live-screen/config", { cache: "no-store" });
  if (!response.ok) throw new Error("Không tải được cấu hình chia sẻ màn hình.");
  return response.json() as Promise<LiveScreenConfig>;
}

export function liveScreenWebSocketUrl(path: string): string {
  const url = new URL(path, window.location.origin);
  url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function vietnameseShareError(error: unknown): string {
  if (error instanceof DOMException && ["NotAllowedError", "AbortError"].includes(error.name)) {
    return "Bạn đã hủy hoặc từ chối chọn màn hình.";
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "Không tìm thấy màn hình hoặc cửa sổ có thể chia sẻ.";
  }
  return error instanceof Error ? error.message : "Không thể bắt đầu chia sẻ màn hình.";
}
