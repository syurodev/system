import Elysia from "elysia";
import { createSuccessResponse } from "@repo/utils";

export const publicRoutes = new Elysia({
  name: "publicRoutes",
  prefix: "/public",
}).get("/health-check", () => {
  return createSuccessResponse(null, "ok");
});
