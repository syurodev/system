import Elysia from "elysia";
import { apiRoutesV1 } from "./v1";
import { publicRoutes } from "./public/public.controller";

export const apiRoutes = new Elysia({
  prefix: "/api",
})
  .use(publicRoutes)
  .use(apiRoutesV1);
