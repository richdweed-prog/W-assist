# ZNAssist

React / Express / tRPC / Drizzle starter, adapted from the Sandbox web-db-user template.

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm db:migrate`: apply checked-in migrations. `pnpm db:push`: generate and apply new schema changes.
- `pnpm check` / `pnpm test`: types and application tests.

Start with the Webdev skill's default-template guide. Platform login, storage, payments and service contracts live in its shared references; read the relevant capability before extending its helper.

`server/_core/publicConfig.ts` exposes only named public runtime values. Private keys stay server-side. The platform serves managed `/manus-storage/` assets; the application does not register a second proxy.

Platform configuration is readable and editable through `webdev.config`. Default settings are initial values, not enforced constraints. The agent may modify the files, commands and configuration or follow the flexible guide for another stack.

## Deploy no Render

O repositório inclui `render.yaml` com um Web Service Node, build via pnpm, `pnpm start` e healthcheck em `/api/health`. No Render, crie um Blueprint a partir do repositório privado `richdweed-prog/znassist` ou crie um Web Service selecionando a branch `main`. O Render pode acessar repositórios privados depois que a integração GitHub estiver autorizada para esse repositório.

Na primeira configuração, preencha no ambiente do serviço `OPENAI_API_KEY` com uma chave do seu provedor e `LLM_MODEL` com um modelo disponível nessa conta. `OPENAI_API_BASE` já vem como `https://api.openai.com`, mas pode ser trocada por outro endpoint OpenAI-compatible. Não use nem faça commit de `MANUS_API_KEY`: as credenciais `MANUS_API_*` pertencem ao runtime gerenciado do Manus e não são necessárias no Render.

Para deploy manual, use `corepack enable && corepack prepare pnpm@10.18.0 --activate && pnpm install --frozen-lockfile && pnpm build` como Build Command e `pnpm start` como Start Command. O servidor já escuta `0.0.0.0` e respeita a variável `PORT` fornecida pelo Render.
