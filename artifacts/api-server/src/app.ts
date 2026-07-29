import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { rateLimit } from "./middleware/rateLimit";
import { responseCache } from "./middleware/responseCache";
import { errorHandler } from "./middleware/errorHandler";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: [
      'https://pazaryeri0.web.app',
      'https://pazaryeri0.firebaseapp.com',
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:8082',
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit);
app.use(
  responseCache(8_000, (req) => {
    const pathOnly = req.originalUrl.split("?")[0] ?? "";
    return (
      pathOnly === "/api/listings" ||
      pathOnly.startsWith("/api/locations") ||
      pathOnly === "/api/search"
    );
  }),
);

app.get("/", (_req, res) => {
  res.json({
    name: "Pazaryeri API",
    status: "ok",
    health: "/api/healthz",
    site: "https://pazaryeri0.web.app",
  });
});

app.use("/api", router);

app.use(errorHandler);

export default app;
