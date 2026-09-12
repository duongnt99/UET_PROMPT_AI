import { createServer } from "node:http";
import next from "next";
import { attachLiveScreenSignaling } from "@/server/live-screen/signaling";
import { startEmailWorker } from "@/server/email/email-worker";

async function main() {
  const dev = process.argv.includes("--dev") || process.env.NODE_ENV !== "production";
  const hostname = process.env.SERVER_HOST || "0.0.0.0";
  const port = Number.parseInt(process.env.PORT || "3000", 10);
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = createServer((request, response) => {
    void handle(request, response).catch((error) => {
      console.error("Không xử lý được HTTP request", error);
      if (!response.headersSent) response.writeHead(500);
      response.end("Internal Server Error");
    });
  });

  attachLiveScreenSignaling({
    server,
    handleNextUpgrade: app.getUpgradeHandler(),
  });

  const stopEmailWorker = startEmailWorker();
  server.on("close", stopEmailWorker);

  server.listen(port, hostname, () => {
    console.info(`> AI Arena Viet Nam sẵn sàng tại http://${hostname}:${port}`);
  });
}

void main().catch((error) => {
  console.error("Không khởi động được máy chủ AI Arena Viet Nam", error);
  process.exitCode = 1;
});
