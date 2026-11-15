import { Streamdown } from "streamdown";
import {
  Activity,
  ArrowUp,
  Braces,
  Check,
  ChevronDown,
  CircleAlert,
  Code2,
  ExternalLink,
  Globe2,
  Menu,
  PanelRight,
  Plus,
  Search,
  ShieldCheck,
  TerminalSquare,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Role = "user" | "assistant";
type ChatMessage = { id: string; role: Role; content: string };
type EventItem = { type: string; label: string; detail?: string };
type Source = { title: string; url: string; domain: string; snippet: string; fetchStatus?: string };

type AgentResponse = {
  answer: string;
  mode: "web" | "local";
  sources: Source[];
  events: EventItem[];
};

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "Estou pronto. Posso analisar tráfego capturado, depurar APIs, escrever scripts e pesquisar na web quando o toggle `z3` estiver ativo.\n\n> Dica: pergunte algo como **“por que esta API está retornando 401?”** e cole apenas o trecho de tráfego necessário.",
  },
];

const initialTraffic = `GET https://api.example.com/v1/profile
HTTP/2 401 Unauthorized
content-type: application/json
x-request-id: req_7f8c

{"error":"invalid_token","message":"Token expired"}`;

const HISTORY_KEY = "znassist:conversation:v1";

function loadStoredMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return initialMessages;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return initialMessages;
    const valid = parsed.filter((item): item is ChatMessage => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Record<string, unknown>;
      return typeof candidate.id === "string" && (candidate.role === "user" || candidate.role === "assistant") && typeof candidate.content === "string";
    });
    return valid.length > 0 ? valid.slice(-40) : initialMessages;
  } catch {
    return initialMessages;
  }
}

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function Toggle({ label, value, onChange, hint }: { label: string; value: boolean; onChange: () => void; hint: string }) {
  return (
    <button className={`toggle ${value ? "is-on" : ""}`} onClick={onChange} title={hint} aria-pressed={value}>
      <span className="toggle-dot" />
      <span>{label}</span>
    </button>
  );
}

function AgentEventStream({ events, busy }: { events: EventItem[]; busy: boolean }) {
  return (
    <div className="event-stream" aria-live="polite">
      <div className="event-stream-head">
        <span>EVENT STREAM</span>
        <span className={busy ? "live-dot" : "quiet-dot"}>{busy ? "LIVE" : "IDLE"}</span>
      </div>
      <div className="event-list">
        {events.slice(-8).map((event, index) => (
          <div className="event-row" key={`${event.label}-${index}`}>
            <span className={`event-mark event-${event.type}`} />
            <div>
              <div className="event-label">{event.label}</div>
              {event.detail && <div className="event-detail">{event.detail}</div>}
            </div>
          </div>
        ))}
        {events.length === 0 && <div className="empty-note">Nenhum evento nesta sessão.</div>}
      </div>
    </div>
  );
}

function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) {
    return <div className="empty-note">As fontes aparecem aqui quando `z3` está ativo.</div>;
  }
  return (
    <div className="source-list">
      {sources.map((source, index) => (
        <a className="source-item" href={source.url} target="_blank" rel="noreferrer noopener" key={source.url}>
          <div className="source-index">0{index + 1}</div>
          <div className="source-copy">
            <div className="source-domain">{source.domain} <ExternalLink size={11} /></div>
            <div className="source-title">{source.title}</div>
            <div className="source-snippet">{source.snippet}</div>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadStoredMessages);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [input, setInput] = useState("");
  const [traffic, setTraffic] = useState(initialTraffic);
  const [busy, setBusy] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [mobileInspector, setMobileInspector] = useState(false);
  const [toggles, setToggles] = useState({ z: true, z2: true, z3: true });

  const contextLabel = useMemo(() => {
    if (!toggles.z) return "context off";
    if (!traffic.trim()) return "empty context";
    return `${traffic.length.toLocaleString("pt-BR")} chars`;
  }, [toggles.z, traffic]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // O chat continua funcionando mesmo quando o WebView bloqueia storage.
    }
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || busy) return;
    const userMessage: ChatMessage = { id: uid(), role: "user", content: text };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput("");
    setBusy(true);
    setSources([]);
    setEvents([
      { type: "thinking", label: "agent/thinking", detail: "Preparando o turno." },
      ...(toggles.z3 ? [{ type: "search", label: "web/search", detail: "Consultando o buscador real…" }] : []),
    ]);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map(({ role, content }) => ({ role, content })),
          readTraffic: toggles.z,
          maskSecrets: toggles.z2,
          useWeb: toggles.z3,
          trafficContext: traffic,
        }),
      });
      const data = (await response.json()) as AgentResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "Falha na execução");
      setEvents(data.events || []);
      setSources(data.sources || []);
      setMessages(current => [...current, { id: uid(), role: "assistant", content: data.answer }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado";
      setEvents(current => [...current, { type: "error", label: "agent/error", detail: message }]);
      setMessages(current => [...current, { id: uid(), role: "assistant", content: `Não consegui executar o turno.\n\n\`${message}\`\n\nO texto da sua pergunta foi preservado no histórico local.` }]);
    } finally {
      setBusy(false);
    }
  }

  function newSession() {
    setMessages(initialMessages);
    setEvents([]);
    setSources([]);
    setInput("");
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore storage errors
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="mobile-menu"><Menu size={18} /></div>
        <div className="brand-lockup"><span className="brand-mark">ZN/</span><span className="brand-name">ASSIST</span><span className="brand-path">~/znproxy</span></div>
        <div className="topbar-spacer" />
        <div className="connection-status"><span className="status-light" /> web {toggles.z3 ? "connected" : "off"}</div>
        <div className="topbar-actions">
          <Toggle label="z" value={toggles.z} onChange={() => setToggles(t => ({ ...t, z: !t.z }))} hint="Ler contexto de tráfego" />
          <Toggle label="z2" value={toggles.z2} onChange={() => setToggles(t => ({ ...t, z2: !t.z2 }))} hint="Mascarar segredos no contexto" />
          <Toggle label="z3" value={toggles.z3} onChange={() => setToggles(t => ({ ...t, z3: !t.z3 }))} hint="Usar busca web real" />
        </div>
        <button className="icon-button" onClick={() => setMobileInspector(v => !v)} title="Abrir inspector"><PanelRight size={17} /></button>
      </header>

      <div className="workspace-layout">
        <aside className="command-rail">
          <button className="new-session" onClick={newSession}><Plus size={16} /><span>nova sessão</span><kbd>⌘ N</kbd></button>
          <div className="rail-section-label">WORKSPACE</div>
          <button className="rail-item active"><TerminalSquare size={15} /><span>agent</span><span className="rail-count">1</span></button>
          <button className="rail-item"><Code2 size={15} /><span>snippets</span></button>
          <button className="rail-item"><Braces size={15} /><span>traffic</span></button>
          <div className="rail-section-label history-label">RECENTES</div>
          <button className="session-item active"><span className="session-dot" /><span className="truncate">debug 401 api</span></button>
          <button className="session-item"><span className="session-dot muted" /><span className="truncate">oauth redirect</span></button>
          <button className="session-item"><span className="session-dot muted" /><span className="truncate">json outline</span></button>
          <div className="rail-footer"><ShieldCheck size={14} /><span>safe mode</span></div>
        </aside>

        <main className="chat-column">
          <div className="chat-header">
            <div><div className="eyebrow">AGENT SESSION</div><h1>Depurar com contexto</h1></div>
            <div className="chat-meta"><span className="model-pill"><Zap size={12} /> auto</span><span className="slash">/</span><span>sem persistência</span></div>
          </div>
          <div className="chat-scroll">
            <div className="session-intro"><span className="intro-line" /> <span>sessão iniciada agora · modelo server-side</span></div>
            {messages.map(message => (
              <article className={`message-block ${message.role}`} key={message.id}>
                <div className="message-gutter">{message.role === "user" ? <span className="user-caret">›</span> : <span className="assistant-symbol">✦</span>}</div>
                <div className="message-body">
                  <div className="message-author">{message.role === "user" ? "você" : "znassist"}<span className="message-time">{message.role === "assistant" ? "agent" : "input"}</span></div>
                  {message.role === "assistant" ? <Streamdown>{message.content}</Streamdown> : <p>{message.content}</p>}
                </div>
              </article>
            ))}
            {busy && <div className="thinking-line"><span className="thinking-pulse" /> agente trabalhando<span className="thinking-cursor" /></div>}
          </div>

          <div className="composer-wrap">
            <div className="composer-context"><span className="context-dot" /> contexto: <strong>{contextLabel}</strong><span className="context-sep">·</span> web: <strong>{toggles.z3 ? "on" : "off"}</strong><button className="context-expand" onClick={() => setShowTraffic(v => !v)}>{showTraffic ? "fechar" : "editar"} <ChevronDown size={13} className={showTraffic ? "rotate" : ""} /></button></div>
            {showTraffic && <textarea className="traffic-editor" value={traffic} onChange={event => setTraffic(event.target.value)} spellCheck={false} aria-label="Contexto de tráfego" />}
            <div className="composer">
              <textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Pergunte ao agente… (Enter envia, Shift+Enter quebra linha)" rows={2} disabled={busy} />
              <button className="send-button" onClick={() => void sendMessage()} disabled={!input.trim() || busy} title="Enviar mensagem"><ArrowUp size={18} /></button>
            </div>
            <div className="composer-footer"><span><Search size={12} /> {toggles.z3 ? "busca real + fontes" : "modo local"}</span><span>não cole segredos</span></div>
          </div>
        </main>

        <aside className={`inspector ${mobileInspector ? "mobile-open" : ""}`}>
          <div className="inspector-head"><div><div className="eyebrow">INSPECTOR</div><h2>Contexto ativo</h2></div><button className="icon-button mobile-close" onClick={() => setMobileInspector(false)}><X size={16} /></button></div>
          <section className="inspector-section"><div className="section-title"><Activity size={14} /> execução</div><AgentEventStream events={events} busy={busy} /></section>
          <section className="inspector-section"><div className="section-title"><Globe2 size={14} /> fontes <span className="section-count">{sources.length}</span></div><SourceList sources={sources} /></section>
          <section className="inspector-section context-section"><div className="section-title"><ShieldCheck size={14} /> segurança</div><div className="security-list"><div><span className={`check ${toggles.z ? "on" : "off"}`}>{toggles.z ? <Check size={11} /> : <X size={11} />}</span><span>tráfego como dado não confiável</span></div><div><span className={`check ${toggles.z2 ? "on" : "off"}`}>{toggles.z2 ? <Check size={11} /> : <X size={11} />}</span><span>segredos mascarados</span></div><div><span className="check on"><Check size={11} /></span><span>credenciais ficam no servidor</span></div></div></section>
          <div className="inspector-footer"><span className="footer-key">z3</span><span>alterna pesquisa externa</span></div>
        </aside>
      </div>
    </div>
  );
}
