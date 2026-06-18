import path from "node:path";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

export function createApp({ gatewayUrl, distDir }) {
  const app = express();
  app.disable("x-powered-by");

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "ch-portal-drive" });
  });

  app.use(
    createProxyMiddleware({
      pathFilter: "/api",
      target: gatewayUrl,
      changeOrigin: true,
      xfwd: true,
    })
  );

  app.use(express.static(distDir));
  app.use((_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });

  return app;
}
