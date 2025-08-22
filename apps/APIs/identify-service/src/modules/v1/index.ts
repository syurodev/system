import Elysia from "elysia";
import { userRoutesV1 } from "./users/user.controller";

export const apiRoutesV1 = new Elysia({
  name: "apiRoutesV1",
  prefix: "/v1",
}).use(userRoutesV1);
