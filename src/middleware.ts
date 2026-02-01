import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const token = req.nextauth.token;

        // Allow access to banned page, login, and api/auth routes
        if (pathname.startsWith("/banned") ||
            pathname.startsWith("/login") ||
            pathname.startsWith("/api/auth")) {
            return NextResponse.next();
        }

        // Check if user is banned from JWT token - redirect immediately
        if (token?.isBanned === true) {
            const bannedUrl = new URL("/banned", req.url);
            return NextResponse.redirect(bannedUrl);
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|login|banned).*)",
    ],
};
