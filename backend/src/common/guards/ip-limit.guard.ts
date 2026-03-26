import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IpLimitGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = this.getClientIp(request);

    // Get count of accounts created from this IP in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const count = await this.prisma.user.count({
      where: {
        createdIp: ip,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Allow maximum 3 accounts per IP
    if (count >= 3) {
      throw new ForbiddenException(
        'تم تجاوز الحد المسموح لإنشاء الحسابات من هذا الجهاز. يرجى التواصل مع الدعم الفني.',
      );
    }

    // Attach IP to request for later use
    request.clientIp = ip;
    return true;
  }

  private getClientIp(request: any): string {
    // Try different headers for real IP (behind proxy/load balancer)
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
}
