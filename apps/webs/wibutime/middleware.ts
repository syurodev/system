import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./lib/i18n/routing";

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

// Better Auth middleware - session validation sẽ được handle bởi components
// Chỉ cần i18n middleware cho routing locales
export default function middleware(request: NextRequest) {
  // Apply i18n middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
