# Conectar o Ollama local ao W Assistant no Render

O Render não consegue acessar `127.0.0.1` do Windows. Este fluxo usa um gateway local com token obrigatório e um Cloudflare Quick Tunnel. O gateway expõe somente `GET /v1/models` e `POST /v1/chat/completions`; a porta do Ollama nunca é publicada diretamente.

## 1. Atualizar o projeto no Windows

Baixe o projeto do repositório privado ou copie a pasta `tools/ollama-gateway.mjs` para o computador que executa o Ollama. O Node.js 22 ou mais recente é recomendado.

## 2. Iniciar o gateway autenticado

Abra um PowerShell na pasta do projeto e gere um token local. Não envie esse token pelo chat.

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$env:OLLAMA_GATEWAY_TOKEN = [Convert]::ToBase64String($bytes)
node tools/ollama-gateway.mjs
```

O gateway deve mostrar `Gateway autenticado em http://127.0.0.1:11435`. Mantenha essa janela aberta. O Ollama deve continuar rodando em `http://127.0.0.1:11434`.

## 3. Instalar e iniciar o Cloudflare Tunnel

Em outro PowerShell:

```powershell
winget install Cloudflare.cloudflared
```

Feche e abra o PowerShell novamente se o comando ainda não aparecer. Depois execute:

```powershell
cloudflared tunnel --url http://127.0.0.1:11435
```

O comando exibirá uma URL temporária parecida com `https://alguma-coisa.trycloudflare.com`. Não encerre essa janela: o endereço deixa de funcionar quando o processo termina. O Quick Tunnel é adequado para teste gratuito; para um endereço permanente, crie um túnel nomeado no painel Cloudflare.

## 4. Testar o gateway

Substitua `URL_PUBLICA` pela URL exibida e `TOKEN_LOCAL` pelo mesmo token da primeira janela. No PowerShell:

```powershell
$headers = @{ Authorization = "Bearer TOKEN_LOCAL" }
$body = '{"model":"qwen3:14b","messages":[{"role":"user","content":"Responda em português em uma frase."}],"think":false}'
Invoke-RestMethod -Uri "URL_PUBLICA/v1/chat/completions" -Method Post -Headers $headers -ContentType "application/json" -Body $body
```

Se retornar JSON com uma resposta do Qwen, a ponte está funcionando.

## 5. Variáveis do Render

No serviço do W Assistant, configure no painel do Render:

```env
OPENAI_API_BASE=https://URL_PUBLICA
OPENAI_API_KEY=TOKEN_LOCAL
LLM_MODEL=qwen3:14b
```

Não acrescente `/v1` a `OPENAI_API_BASE`: o W Assistant já adiciona `/v1/chat/completions`.

O token é necessário porque o Quick Tunnel fornece um endereço acessível pela internet. Mesmo com o token, não reutilize esse gateway para outros serviços e encerre o túnel quando não estiver usando.

## Fontes

- Ollama OpenAI compatibility: https://docs.ollama.com/openai
- Ollama Windows: https://docs.ollama.com/windows
- Cloudflare Tunnel: https://developers.cloudflare.com/tunnel/
- Cloudflare Quick Tunnels: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
