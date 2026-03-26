import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  // Get tenant by subdomain (for storefront)
  async getBySubdomain(subdomain: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        subdomain: true,
        name: true,
        nameAr: true,
        description: true,
        // descriptionAr: true, // Temporarily disabled
        logo: true,
        banner: true,
        theme: true,
        status: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Store not found');
    }

    return tenant;
  }

  // Check if subdomain is available
  async isSubdomainAvailable(subdomain: string): Promise<boolean> {
    const existing = await this.prisma.tenant.findUnique({
      where: { subdomain },
    });
    return !existing;
  }
}
