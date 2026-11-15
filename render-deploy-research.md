# Render — notas de deploy do ZNAssist

Fontes consultadas em 15/11/2026:

- https://render.com/docs/deploy-node-express-app — o Render publica um app Express via Web Service conectado ao repositório; Build Command e Start Command são definidos no serviço.
- https://render.com/docs/web-services — Web Services devem escutar em `0.0.0.0` e respeitar a variável `PORT`; o Render fornece uma URL `onrender.com` e permite conectar repositórios públicos ou privados autorizados.
- https://render.com/docs/configure-environment-variables — segredos devem ser cadastrados no ambiente do serviço; valores não devem ser commitados no repositório. Blueprints aceitam `sync: false` para pedir preenchimento no painel.
- https://render.com/docs/git-provider — é necessário conectar o provedor Git e autorizar o acesso ao repositório privado; pushes na branch conectada podem disparar deploy automático.
- https://render.com/docs/blueprint-spec — o Blueprint fica em `render.yaml` na raiz; para o parser atual usado nesta configuração, `autoDeploy: true` é usado como booleano.

Configuração do projeto:

- Repositório: https://github.com/richdweed-prog/znassist
- Branch: `main`
- Blueprint: `render.yaml`
- Healthcheck: `/api/health`
- Build: `corepack enable && corepack prepare pnpm@10.18.0 --activate && pnpm install --frozen-lockfile && pnpm build`
- Start: `pnpm start`
- Variáveis: `OPENAI_API_BASE`, `OPENAI_API_KEY`, `LLM_MODEL`.
