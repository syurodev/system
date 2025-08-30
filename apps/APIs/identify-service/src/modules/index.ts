import Elysia from "elysia";
import { apiRoutesV1 } from "./v1";
import { publicRoutes } from "./public/public.controller";
import { authRoutes } from "./auth/auth.controller";

export const apiRoutes = new Elysia({
  prefix: "/api",
})
  .use(publicRoutes)
  .use(authRoutes)
  .use(apiRoutesV1);
