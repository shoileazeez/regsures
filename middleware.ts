import { NextRequest, NextResponse } from 'next/server'; import { verifyJwt } from '@/lib/auth';
export function middleware(request: NextRequest) { const token = request.cookies.get('regsure_session')?.value; if (!token || !verifyJwt(token)) return NextResponse.redirect(new URL('/auth/login?next=' + encodeURIComponent(request.nextUrl.pathname), request.url)); return NextResponse.next(); }
export const config = { matcher: ['/dashboard/:path*'] };
