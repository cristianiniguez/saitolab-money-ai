import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard']
const authRoutes = ['/sign-in', '/sign-up', '/verify-email']

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isAuthenticated = !!req.cookies.get('insforge_access_token')

  if (protectedRoutes.some(r => path.startsWith(r)) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
  }

  if (authRoutes.some(r => path.startsWith(r)) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
