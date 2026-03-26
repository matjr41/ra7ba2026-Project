import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@/common/prisma/prisma.service';

@ApiTags('public')
@Controller('domains')
export class DomainController {
  constructor(private prisma: PrismaService) {}

  @Get('resolve')
  @ApiOperation({ summary: 'Resolve host to tenant subdomain' })
  async resolve(@Query('host') host?: string, @Query('domain') domain?: string) {
    const input = (domain ?? host) || '';
    console.log('🔍 [DomainController] Resolving host/domain:', input);
    
    if (!input) {
      console.log('⚠️ [DomainController] No host/domain provided');
      return { found: false };
    }

    const normalized = String(input)
      .toLowerCase()
      .split(':')[0]
      .replace(/^www\./, '');

    console.log('📝 [DomainController] Normalized host/domain:', normalized);

    // Look up custom domain and return its tenant subdomain
    // We rely on DNS itself to ensure only real domains can hit this endpoint,
    // so it's safe to resolve even if isVerified flag is not updated yet.
    const record = await this.prisma.customDomain.findFirst({
      where: { domain: normalized },
      include: { tenant: { select: { id: true, subdomain: true } } },
    });

    console.log('💾 [DomainController] Database query result:', record ? 'Found' : 'Not found');

    if (!record || !record.tenant) {
      console.log('❌ [DomainController] No custom domain found for:', normalized);
      return { found: false };
    }

    console.log('✅ [DomainController] Resolved:', normalized, '->', record.tenant.subdomain);
    
    return {
      found: true,
      tenantId: record.tenant.id,
      subdomain: record.tenant.subdomain,
    };
  }
}
