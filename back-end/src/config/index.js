export const config = {
  port: Number(process.env.PORT) || 4545,
  host: process.env.HOST || "0.0.0.0",
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  },
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    accessSecret:
      process.env.ACCESS_TOKEN_SECRET || "your-access-token-secret-key",
    refreshSecret:
      process.env.REFRESH_TOKEN_SECRET || "your-refresh-token-secret-key",
    accessExpiration: "50m", // 15 mins
    refreshExpiration: "7d", // 7 days
  },
  logger: {
    level: process.env.LOG_LEVEL || "info",
    folder: process.env.LOG_FOLDER || "logs",
  },
};
