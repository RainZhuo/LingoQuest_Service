import app from "./app.js";
import { env } from "./config.js";
import { logger } from "./lib/logger.js";

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info({ port: env.PORT }, "lingoquest-service listening");
});
