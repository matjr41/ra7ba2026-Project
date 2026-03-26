import { NextRequest, NextResponse } from 'next/server';

// Backend API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ra7ba-backend.onrender.com';

// Cache for custom domains (to avoid hitting API on every request)
const domainCache = new Map<string, { tenantId: string; tenant: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getTenantByDomain(domain: string): Promise<{ tenantId: string; tenant: any } | null> {
  // Check cache first
  const cached = domainCache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }

  try {
    // Query backend API for custom domain
    const response = await fetch(`${BACKEND_URL}/store/domain/${domain}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.tenantId) {
        // Cache the result
        domainCache.set(domain, { tenantId: data.tenantId, tenant: data.tenant, timestamp: Date.now() });
        return data;
      }
    }
  } catch (error) {
    console.error('Error fetching tenant by domain:', error);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const normalizedHost = hostname.replace(/^www\./, '').toLowerCase();

  // Skip for static files and API routes
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/public/')
  ) {
    return NextResponse.next();
  }

  // Check if this is the main platform domain
  if (normalizedHost === 'ra7ba.shop' || normalizedHost === 'localhost:3000') {
    return NextResponse.next();
  }

  // Check if this is a custom domain
  const tenantResult = await getTenantByDomain(normalizedHost);
  
  if (tenantResult && tenantResult.tenant) {
    // This is a custom domain - rewrite to tenant store using subdomain
    const url = request.nextUrl.clone();
    url.pathname = `/store/${tenantResult.tenant.subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Handle subdomain routing (tenant.ra7ba.shop)
  const parts = normalizedHost.split('.');
  if (parts.length >= 3 && parts[2] === 'shop') {
    const subdomain = parts[0];
    if (subdomain !== 'www' && subdomain !== 'ra7ba') {
      // Get tenant by subdomain
      try {
        const response = await fetch(`${BACKEND_URL}/store/subdomain/${subdomain}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.tenantId) {
            const url = request.nextUrl.clone();
            url.pathname = `/store/${data.tenantId}${url.pathname}`;
            return NextResponse.rewrite(url);
          }
        }
      } catch (error) {
        console.error('Error fetching tenant by subdomain:', error);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};