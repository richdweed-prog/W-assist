import http from "node:http";

const upstream = "http://127.0.0.1:11434";
const host = "127.0.0.1";
const port = Number(process.env.OLLAMA_GATEWAY_PORT || 11435);
const token = process.env.OLLAMA_GATEWAY_TOKEN;

if (!token || token.length < 24) {
  console.error("Defina OLLAMA_GATEWAY_TOKEN com pelo menos 24 caracteres antes de iniciar.");
  process.exit(1);
}

const allowed = new Set(["GET /v1/models", "POST /v1/chat/completions"]);

function authorized(request) {
  const header = request.headers.authorization || "";
  return header === `Bearer ${token}`;
}

function reject(response, status, message) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify({ error: message }));
}

const server = http.createServer(async (request, response) => {
  const method = request.method || "GET";
  const pathname = new URL(request.url || "/", `http://${host}:${port}`).pathname;

  if (!allowed.has(`${method} ${pathname}`)) {
    reject(response, 404, "Endpoint não disponível neste gateway.");
    return;
  }
  if (!authorized(request)) {
    reject(response, 401, "Bearer token inválido.");
    return;
  }

  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > 2 * 1024 * 1024) {
      reject(response, 413, "Payload muito grande.");
      return;
    }
    chunks.push(chunk);
  }

  try {
    const upstreamResponse = await fetch(`${upstream}${pathname}`, {
      method,
      headers: {
        "content-type": request.headers["content-type"] || "application/json",
        authorization: "Bearer local-gateway",
      },
      body: method === "GET" ? undefined : Buffer.concat(chunks),
      signal: AbortSignal.timeout(180_000),
    });

    response.writeHead(upstreamResponse.status, {
      "content-type": upstreamResponse.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
    });
    response.end(Buffer.from(await upstreamResponse.arrayBuffer()));
  } catch (error) {
    console.error("Falha ao encaminhar para o Ollama:", error);
    reject(response, 502, "Ollama local não respondeu.");
  }
});

server.listen(port, host, () => {
  console.log(`Gateway autenticado em http://${host}:${port}`);
  console.log("Permitidos: GET /v1/models e POST /v1/chat/completions");
});
