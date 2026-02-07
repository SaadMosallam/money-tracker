import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { defaultLocale, getLocaleFromPathname, locales } from "@/lib/i18n";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const localeFromPath = getLocaleFromPathname(pathname);
  if (!localeFromPath) {
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
    const resolvedLocale =
      cookieLocale && (locales as readonly string[]).includes(cookieLocale)
        ? cookieLocale
        : defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${resolvedLocale}${pathname}`;
    return NextResponse.redirect(url);
  }
  const locale = localeFromPath;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (pathname === `/${locale}/login`) {
    if (token) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}`;
      url.search = "";
      return NextResponse.redirect(url);
    }
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.cookies.set("NEXT_LOCALE", locale);
    return res;
  }

  if (pathname === `/${locale}/forgot-password` || pathname === `/${locale}/reset-password`) {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.cookies.set("NEXT_LOCALE", locale);
    return res;
  }

  if (!token) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = `/${locale}/login`;
    signInUrl.searchParams.set(
      "callbackUrl",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(signInUrl);
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.cookies.set("NEXT_LOCALE", locale);
  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\..*).*)",
  ],
};
