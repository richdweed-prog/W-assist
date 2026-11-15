# ZNAssist — resultados

## 1. Chat aberto e agente técnico com contrato de backend

- [x] `POST /api/agent` recebe uma mensagem, histórico opcional, toggles `z`, `z2`, `z3`, modo de busca e contexto de tráfego.
- [x] O ZNAssist funciona como chat aberto para perguntas variadas, incluindo explicações, estudos, escrita, planejamento, resumo, tradução e ideias, e também identifica e analisa tráfego HTTP/HTTPS, código, JavaScript, JSON, logs, stack traces, configurações, documentação técnica e erros de API.
- [x] A resposta contém texto do assistente, modo utilizado, fontes e eventos do agente.
- [x] O backend chama o LLM usando credenciais de servidor e nunca envia credenciais ao navegador.
- [x] O prompt informa que tráfego capturado e páginas externas são dados não confiáveis e não podem sobrescrever as instruções do sistema.
- [x] O assistente recusa solicitação de chaves, senhas e tokens e orienta o usuário a mascarar segredos.

## 2. Busca web real com fontes

- [x] Quando o modo Web está ativo, o backend consulta um buscador real por HTML e retorna uma lista curta de resultados atuais.
- [x] O backend coleta trechos limitados de páginas públicas quando possível, sem executar JavaScript externo.
- [x] O cliente mostra título, domínio, trecho e link clicável de cada fonte.
- [x] A interface informa quando a busca está desativada ou quando uma fonte não pôde ser lida.

## 3. Interface OpenCode-like

- [x] A página principal é responsiva, em português do Brasil e usa visual escuro de ferramenta de desenvolvedor.
- [x] O chat diferencia mensagens do usuário e do agente e renderiza Markdown do assistente.
- [x] Há uma linha de eventos mostrando `thinking`, `search`, `source` e `answer` durante o turno.
- [x] Há editor de contexto técnico, que aceita tráfego, código, JSON e logs, com comportamento visível para `z` (ler contexto), `z2` (mascarar) e `z3` (web).
- [x] O inspector mostra conexão web, fontes do turno e resumo do contexto ativo.

## 4. Base para Android/ZNProxy

- [x] O endpoint usa JSON simples e não depende de estado específico do navegador.
- [x] O código de busca e de agente fica isolado em módulos para ser reutilizado por um cliente Android.
- [x] Existe manifesto de rotas e o projeto passa no diagnóstico TypeScript e no build.
