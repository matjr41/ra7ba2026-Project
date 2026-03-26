import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

// Extend Express Request to include tenant
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: any;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extract subdomain from host
    const host = req.headers.host || req.hostname;
    
    // For development: localhost:3000 or app.localhost:3000
    // For production: store.rahba.dz
    const subdomain = this.extractSubdomain(host);

    if (!subdomain || subdomain === 'app' || subdomain === 'admin' || subdomain === 'www') {
      // No tenant for main app or admin panel
      return next();
    }

    // Find tenant by subdomain
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        subdomain: true,
        name: true,
        status: true,
        trialEndsAt: true,
        subscription: {
          select: {
            status: true,
            plan: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Store not found');
    }

    // Check if tenant is active
    if (tenant.status === 'SUSPENDED' || tenant.status === 'EXPIRED') {
      return res.status(403).json({
        statusCode: 403,
        message: 'This store is temporarily unavailable',
        messageAr: 'هذا المتجر غير متاح مؤقتاً',
      });
    }

    // Attach tenant to request
    req.tenantId = tenant.id;
    req.tenant = tenant;

    next();
  }

  private extractSubdomain(host: string): string | null {
    // Remove port if exists
    const hostname = host.split(':')[0];
    
    // Split by dots
    const parts = hostname.split('.');
    
    // For localhost development
    if (hostname.includes('localhost')) {
      // Check for pattern like "store.localhost"
      if (parts.length > 1) {
        return parts[0];
      }
      return null;
    }

    // For production (e.g., store.rahba.dz)
    if (parts.length >= 3) {
      return parts[0];
    }

    return null;
  }
}
