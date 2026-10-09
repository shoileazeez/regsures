import { NextRequest, NextResponse } from "next/server";

const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  const isApiHost = host === "api.regsure.app";
  const isApiPath = request.nextUrl.pathname.startsWith("/api/");

  if (!isApiHost && !isApiPath) return NextResponse.next();

  if (request.method === "OPTIONS") {
    return withCors(new NextResponse(null, { status: 204 }), request);
  }

  if (isApiHost && !isApiPath) {
    const url = request.nextUrl.clone();
    url.pathname = `/api${url.pathname === "/" ? "" : url.pathname}`;
    return withCors(NextResponse.rewrite(url), request);
  }

  return withCors(NextResponse.next(), request);
}

function withCors(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin === appOrigin || origin === "http://localhost:3000") {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
