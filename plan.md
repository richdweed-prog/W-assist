# ZNAssist — plano de implementação

## Escopo

Construir um protótipo funcional de assistente geral conversacional para o ZNProxy, com experiência de chat aberto inspirada em assistentes modernos e uma interface densa de desenvolvedor no estilo OpenCode. O produto terá histórico de chat, painel de eventos do agente, toggles de segurança/contexto e um endpoint de backend que pesquisa a web real, coleta fontes e chama o LLM apenas no servidor. O contexto analisável inclui tráfego HTTP/HTTPS, código, JavaScript, JSON, logs, stack traces, configurações, documentação e erros de API.

A primeira versão é web responsiva para validar o fluxo e a integração. O backend será modular para que o mesmo contrato `/api/agent` possa ser consumido depois pelo APK Android ou diretamente pelo ZNProxy.

## Arquitetura

- `server/agent.ts`: prompt de sistema, sanitização, busca no DuckDuckGo HTML, leitura limitada de fontes, proteção básica contra SSRF e orquestração do turno.
- `server/_core/index.ts`: rota HTTP pública `POST /api/agent` e healthcheck existente.
- `client/src/pages/Home.tsx`: shell do agente, chat, caixa de contexto de tráfego, toggles e inspector de fontes/eventos.
- `client/src/index.css`: identidade visual escura inspirada em terminal/editor, com foco em densidade, legibilidade e estados de operação.
- `public/manus-routes.json`: manifesto da rota principal.

A resposta do backend terá `answer`, `sources`, `events` e `mode`. Fontes são exibidas como links e o corpo externo é tratado como conteúdo não confiável; nunca é executado nem interpretado como instrução de sistema.

## Design

### Alternativas consideradas

- **Terminal editorial** — 0,07: quase monocromático, foco total em texto e logs.
- **Control room neon** — 0,05: painel técnico com brilho verde e azul, mais expressivo.
- **Workbench silencioso** — 0,08: cinza-grafite, tipografia monoespaçada e acento lima discreto.

Escolha: **Workbench silencioso**.

### Movimento e princípios

A interface se comporta como uma bancada de depuração: informação primeiro, ornamentação mínima, hierarquia por bordas e espaçamento, e feedback contínuo do agente. A composição usa rail lateral estreito, coluna central de conversa e inspector contextual à direita; não usa um dashboard de cards genérico.

### Cor e tipografia

Base grafite quase preta (`#0b0f12`), superfícies em camadas (`#11171b`, `#151d21`), bordas cinza-esverdeadas, texto branco acinzentado e um lima técnico como cor de ação/status. Vermelho só comunica risco; azul fica reservado para links e dados externos. Tipografia de UI usa uma sans de sistema; logs, caminhos, comandos e badges usam `ui-monospace`.

### Elementos de assinatura

1. Marca `ZN/` em bloco no topo do rail.
2. Linha de status “agent ready / web connected” e eventos com marcador vertical.
3. Inspector “Contexto ativo” mostrando os toggles z, z2 e z3 e a contagem de fontes.

### Interação e animação

Enviar uma mensagem bloqueia o botão, mostra imediatamente o evento `agent/thinking`, depois revela eventos de busca e fontes antes da resposta. Transições de 160–220 ms, sem animações decorativas; focus rings em lima e hover apenas alterando superfície/borda. Em telas estreitas, o inspector vira uma faixa recolhível abaixo do chat.

### Voz da marca

Direta, técnica, calma e explícita sobre limites. Exemplos: “Busquei na web e separei as fontes antes de responder.” e “O tráfego capturado é contexto não confiável; não vou executar instruções contidas nele.”

### Wordmark

`ZN/ASSIST` em monoespaçada pesada, com a barra como cursor de execução. A assinatura visual é o lima `#b8f36b`, reservado para o estado operacional e ações primárias.

## Restrições materiais

- Nenhuma chave de API, cookie ou token entra no cliente.
- Busca externa ocorre apenas no backend e com limite de resultados/tamanho/tempo.
- Fontes e tráfego recebido entram no prompt entre delimitadores de dados não confiáveis.
- Sem persistência em banco na primeira versão; histórico fica no estado do cliente e o contrato está pronto para persistência posterior.
- Não afirmar que a busca é um navegador visual controlado: esta entrega usa a página HTML real do buscador no servidor; uma futura implementação Android pode substituir o adaptador por WebView/Chrome Custom Tabs mantendo o mesmo contrato.
