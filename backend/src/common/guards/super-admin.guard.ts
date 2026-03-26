import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Super Admin Guard
 * يسمح فقط للحساب الرئيسي ra7baa1@gmail.com بالوصول لنقاط الأدمن
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('يجب تسجيل الدخول أولاً');
    }

    // التحقق من أن المستخدم هو Super Admin
    const adminEmail = this.config.get<string>('ADMIN_EMAIL') || '';
    if (!adminEmail || user.email !== adminEmail) {
      throw new ForbiddenException(
        'غير مسموح لك بالوصول لهذا المورد. هذا القسم مخصص للمسؤول الرئيسي فقط.',
      );
    }

    return true;
  }
}
