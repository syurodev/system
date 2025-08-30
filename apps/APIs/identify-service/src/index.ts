import { Elysia } from "elysia";
import swagger from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { handleError, initDatabase } from "@repo/elysia";
import { ENV } from "./configs/env";
import { apiRoutes } from "./modules";
import { showStartupBanner } from "./utils/startup-banner";

// Initialize database first
let databaseStatus: "connected" | "error" = "connected";
try {
  await initDatabase({
    hostname: ENV.CONFIG_PG_USER_HOST,
    port: ENV.CONFIG_PG_USER_PORT,
    username: ENV.CONFIG_PG_USER_USERNAME,
    password: ENV.CONFIG_PG_USER_PASSWORD,
    database: ENV.CONFIG_PG_USER_DBNAME,
    connectionTimeout: ENV.CONFIG_PG_USER_IDLE_TIMEOUT,
    idleTimeout: ENV.CONFIG_PG_USER_IDLE_TIMEOUT,
    max: ENV.CONFIG_PG_USER_MAX_CONNECTIONS,
    maxLifetime: ENV.CONFIG_PG_USER_IDLE_TIMEOUT,
    ssl: ENV.CONFIG_PG_USER_SSL === "true",
  });
} catch (error) {
  databaseStatus = "error";
  console.error("Database initialization failed:", error);
}

// Import auth after database is initialized
import { auth } from "./lib/auth";

export const identifyService = new Elysia()
  .use(
    cors({
      origin: true, // Allow all origins in development
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "Identity Service API",
          version: "1.0.0",
          description: "Authentication và User Management Service với Better Auth",
        },
        tags: [
          {
            name: "Authentication",
            description: "Better Auth integration endpoints",
          },
          {
            name: "User Management",
            description: "User CRUD và role management",
          },
        ],
      },
    }),
  )
  // Mount Better Auth handler
  .mount("/api/auth", auth.handler)
  // Add session middleware
  .derive(async ({ request }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return {
      session: session?.session || null,
      user: session?.user || null,
    };
  })
  .use(apiRoutes)
  .onError(handleError);

// Start server
identifyService.listen({
  port: ENV.CONFIG_SERVICE_PORT,
});

showStartupBanner({
  serviceName: "Identity Service",
  port: ENV.CONFIG_SERVICE_PORT,
  environment: process.env.NODE_ENV || "development",
  databaseStatus,
  swaggerEnabled: true,
});
