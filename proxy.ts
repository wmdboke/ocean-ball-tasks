export { auth as middleware } from "@/auth";

export function proxy() {}
// Optionally, configure which routes should be protected
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api/auth (auth API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico, favicon.svg (favicon files)
//      * - public folder
//      */
//     "/((?!api/auth|_next/static|_next/image|favicon.ico|favicon.svg|.*\\.png$).*)",
//   ],
// };

// For now, we'll let all routes be accessible
// Uncomment the config above if you want to protect routes
export const config = {
  matcher: [
    // Apply middleware to all routes except public assets and auth pages
    // "/((?!api/auth|_next|favicon.ico|auth).*)",
  ],
};
