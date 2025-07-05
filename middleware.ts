import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    console.log("Middleware - Token:", req.nextauth.token ? 'Present' : 'Missing')
    console.log("Middleware - Path:", req.nextUrl.pathname)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // 認証不要のパス
        if (pathname.startsWith('/login') || 
            pathname.startsWith('/api/auth') ||
            pathname.startsWith('/_next') ||
            pathname.startsWith('/favicon.ico')) {
          return true
        }
        
        // その他のパスはトークンが必要
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (all API routes - handle auth internally)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
} 