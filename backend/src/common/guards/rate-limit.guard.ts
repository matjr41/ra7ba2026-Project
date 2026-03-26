import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

/**
 * Rate Limiting Guard
 * منع الطلبات المتكررة بشكل مفرط من نفس IP
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private requests = new Map<string, number[]>();
  private readonly limit = 100; // 100 requests
  private readonly windowMs = 15 * 60 * 1000; // per 15 minutes

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = this.getClientIp(request);
    const now = Date.now();

    // Get existing requests for this IP
    let timestamps = this.requests.get(ip) || [];
    
    // Filter out old requests outside the time window
    timestamps = timestamps.filter(time => now - time < this.windowMs);

    // Check if limit exceeded
    if (timestamps.length >= this.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current timestamp
    timestamps.push(now);
    this.requests.set(ip, timestamps);

    // Clean up old entries every hour
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  private cleanup() {
    const now = Date.now();
    for (const [ip, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(
        time => now - time < this.windowMs,
      );
      if (validTimestamps.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, validTimestamps);
      }
    }
  }
}
