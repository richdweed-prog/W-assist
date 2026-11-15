import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { runAgent, type AgentHistoryItem, type AgentOptions } from "../agent";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 20;
// Modelos locais maiores, como qwen3:14b, podem levar mais de 45 s para carregar
// e gerar a primeira resposta através do túnel. O limite continua finito para
// evitar requisições presas, mas dá tempo suficiente para uma máquina comum.
const AGENT_TIMEOUT_MS = 180_000;

function readHistory(value: unknown): AgentHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is AgentHistoryItem => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Record<string, unknown>;
      return (candidate.role === "user" || candidate.role === "assistant") && typeof candidate.content === "string";
    })
    .slice(-10)
    .map(item => ({ role: item.role, content: item.content.slice(0, 6_000) }));
}

function allowedRequest(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= MAX_REQUESTS_PER_MINUTE) return false;
  bucket.count += 1;
  return true;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });

  app.post("/api/agent", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const body = req.body as Partial<AgentOptions>;
    if (typeof body.message !== "string" || body.message.trim().length === 0) {
      return res.status(400).json({ error: "message é obrigatório" });
    }
    if (body.message.length > 8_000) {
      return res.status(413).json({ error: "message excede o limite de 8.000 caracteres" });
    }
    if (!allowedRequest(req.ip || req.socket.remoteAddress || "unknown")) {
      return res.status(429).json({ error: "limite temporário de requisições atingido; tente novamente em instantes" });
    }

    try {
      const agentRun = runAgent({
        message: body.message,
        history: readHistory(body.history),
        readTraffic: body.readTraffic !== false,
        maskSecrets: body.maskSecrets !== false,
        useWeb: body.useWeb === true,
        trafficContext: typeof body.trafficContext === "string" ? body.trafficContext.slice(0, 12_000) : "",
      });
      const result = await Promise.race([
        agentRun,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("tempo limite do agente excedido")), AGENT_TIMEOUT_MS)),
      ]);
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao executar o agente";
      return res.status(500).json({ error: message });
    }
  });

  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
