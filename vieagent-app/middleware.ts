import { type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { updateSession } from "@/utils/supabase/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
    // 1. Update session (handles Supabase cookies)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const response = await updateSession(request);

    // 2. Handle internationalization
    return intlMiddleware(request);
}

export const config = {
    // Matcher that covers all routes except static files and api
    matcher: ["/((?!api|_next|_vercel|auth|.*\\..*).*)"],
};
