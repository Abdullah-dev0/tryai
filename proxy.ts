import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Public routes that don't require authentication
const publicRoutes = ["/sign-in", "/sign-up", "/api/auth"];

// Routes that authenticated users should be redirected away from
const authRoutes = ["/sign-in", "/sign-up"];

export default async function proxy(request: NextRequest) {
	// 	const sessionCookie = getSessionCookie(request);
	// 	const { pathname } = request.nextUrl;
	// 	// Check if the current path is a public route
	// 	const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
	// 	// Check if the current path is an auth route (sign-in, sign-up)
	// 	const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
	// 	// If user is authenticated and trying to access auth routes, redirect to home
	// 	if (sessionCookie && isAuthRoute) {
	// 		return NextResponse.redirect(new URL("/", request.url));
	// 	}
	// 	// If user is not authenticated and trying to access protected routes, redirect to sign-in
	// 	if (!sessionCookie && !isPublicRoute) {
	// 		const signInUrl = new URL("/sign-in", request.url);
	// 		signInUrl.searchParams.set("callbackUrl", pathname);
	// 		return NextResponse.redirect(signInUrl);
	// 	}
	// 	return NextResponse.next();
	// }
}
// Routes Proxy should not run on
export const config = {
	matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
