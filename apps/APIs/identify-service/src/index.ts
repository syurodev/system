import { Elysia } from "elysia";
import swagger from "@elysiajs/swagger";
import { handleError, initDatabase } from "@repo/elysia";
import { ENV } from "./configs/env";
import { apiRoutes } from "./modules";

export const identifyService = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Identity Service API",
          version: "1.0.0",
          description: "Authentication và User Management Service",
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
  .use(apiRoutes)
  .onError(handleError);

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

identifyService.listen({
  port: ENV.CONFIG_SERVICE_PORT,
});
