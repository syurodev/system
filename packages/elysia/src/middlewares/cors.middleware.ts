import Elysia from "elysia";

/**
 * CORS middleware
 */
export function corsMiddleware(allowedOrigins: string[]) {
  return new Elysia({ name: "cors" })
    .options("*", ({ set, request }) => {
      console.log("🚀 CORS preflight OPTIONS request");
      // Handle preflight requests immediately
      const origin = request.headers.get("origin");

      if (origin && allowedOrigins.includes(origin)) {
        set.headers["Access-Control-Allow-Origin"] = origin;
      } else if (process.env.NODE_ENV === "development") {
        set.headers["Access-Control-Allow-Origin"] =
          origin || "http://localhost:3000";
      } else {
        set.headers["Access-Control-Allow-Origin"] =
          allowedOrigins[0] || "http://localhost:3000";
      }

      set.headers["Access-Control-Allow-Methods"] =
        "GET, POST, PUT, DELETE, OPTIONS";
      set.headers["Access-Control-Allow-Headers"] =
        "Content-Type, Authorization, X-Requested-With";
      set.headers["Access-Control-Allow-Credentials"] = "true";
      set.headers["Access-Control-Max-Age"] = "86400"; // 24 hours

      return new Response(null, { status: 204 });
    })
    .onRequest(({ set, request }) => {
      // Get origin from request
      const origin = request.headers.get("origin");

      // Set specific origin if it's in the allowed list, otherwise allow all for development
      if (origin && allowedOrigins.includes(origin)) {
        set.headers["Access-Control-Allow-Origin"] = origin;
      } else if (process.env.NODE_ENV === "development") {
        // In development, allow the requesting origin
        set.headers["Access-Control-Allow-Origin"] =
          origin || "http://localhost:3000";
      } else {
        // In production, be more restrictive
        set.headers["Access-Control-Allow-Origin"] =
          allowedOrigins[0] || "http://localhost:3000";
      }

      set.headers["Access-Control-Allow-Methods"] =
        "GET, POST, PUT, DELETE, OPTIONS";
      set.headers["Access-Control-Allow-Headers"] =
        "Content-Type, Authorization, X-Requested-With";
      set.headers["Access-Control-Allow-Credentials"] = "true";
    });
}
