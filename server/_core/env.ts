// Platform values are read at use time. See the Webdev service/authentication skills.
export const ENV = {
  get appId() { return process.env.MANUS_PROJECT_ID ?? ""; },
  get cookieSecret() { return process.env.MANUS_JWT_SECRET ?? ""; },
  get databaseUrl() { return process.env.DATABASE_URL ?? ""; },
  get oAuthServerUrl() { return process.env.MANUS_OAUTH_API_URL ?? ""; },
  // Preserve the legacy hint when supplied; otherwise roles remain application data.
  get ownerOpenId() { return process.env.OWNER_OPEN_ID ?? ""; },
  get isProduction() { return process.env.NODE_ENV === "production"; },
  // Manus supplies MANUS_API_* in its managed runtime. Render and other
  // hosts can use any OpenAI-compatible endpoint through OPENAI_API_*.
  get forgeApiUrl() { return process.env.MANUS_API_URL ?? process.env.OPENAI_API_BASE ?? "https://api.openai.com"; },
  get forgeApiKey() { return process.env.MANUS_API_KEY ?? process.env.OPENAI_API_KEY ?? ""; },
  get forgeModel() { return process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? ""; },
};
