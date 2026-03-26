import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { Prisma, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  // Register new merchant
  async registerMerchant(dto: {
    email: string;
    password: string;
    name: string;
    phone: string;
    storeName: string;
    storeNameAr: string;
    subdomain: string;
    deviceId?: string;
    clientIp?: string;
  }) {
    try {
      // Basic validation before DB work
      if (!dto.email || !dto.password || !dto.name || !dto.phone || !dto.storeName || !dto.storeNameAr || !dto.subdomain) {
        throw new BadRequestException('Missing required fields');
      }

      // 🔒 Block fake/example emails
      const blockedEmails = [
        'admin@example.com',
        'test@example.com',
        'admin@test.com',
        'test@test.com',
      ];
      const emailLower = dto.email.toLowerCase();
      if (blockedEmails.includes(emailLower) || emailLower.includes('example.com')) {
        throw new BadRequestException(
          'البريد الإلكتروني غير صالح. يرجى استخدام بريد إلكتروني حقيقي.',
        );
      }

      // Prevent using platform admin email in public registration
      const envAdmin = this.config.get<string>('ADMIN_EMAIL');
      if (envAdmin && emailLower === String(envAdmin).toLowerCase()) {
        throw new BadRequestException('لا يمكن استخدام بريد المسؤول للتسجيل.');
      }

      // Check if email exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Check if phone exists
      const existingPhoneUser = await this.prisma.user.findFirst({
        where: { phone: dto.phone },
      });

      if (existingPhoneUser) {
        throw new ConflictException('رقم الهاتف مستخدم من قبل');
      }

      // Check if subdomain exists (select minimal fields to avoid DB column drift)
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { subdomain: dto.subdomain },
        select: { id: true },
      });

      if (existingTenant) {
        throw new ConflictException('Subdomain already taken');
      }

      // Validate subdomain format (alphanumeric, lowercase, hyphens only)
      if (!/^[a-z0-9-]+$/.test(dto.subdomain)) {
        throw new BadRequestException('Invalid subdomain format');
      }

      // Enforce max 3 accounts per device when deviceId is provided
      if (dto.deviceId) {
        const deviceAccountsCount = await this.prisma.user.count({
          where: { deviceId: dto.deviceId },
        });

        if (deviceAccountsCount >= 3) {
          throw new BadRequestException(
            'تم الوصول إلى الحد الأقصى من الحسابات المسموح بها من هذا الجهاز (3 حسابات).',
          );
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Create user and tenant in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: dto.email,
            password: hashedPassword,
            name: dto.name,
            phone: dto.phone,
            role: UserRole.MERCHANT,
            createdIp: dto.clientIp || 'unknown',
            deviceId: dto.deviceId || null,
          },
        });

        // Create tenant with 7-day trial
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);

        const tenant = await tx.tenant.create({
          data: {
            subdomain: dto.subdomain,
            name: dto.storeName,
            nameAr: dto.storeNameAr,
            ownerId: user.id,
            status: 'TRIAL',
            trialEndsAt,
          },
        });

        // Create trial subscription
        await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            status: 'TRIAL',
            plan: 'STANDARD',
          },
        });

        return { user, tenant };
      });

      // Generate tokens
      const tokens = await this.generateTokens(result.user.id, result.user.role);

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        tenant: {
          id: result.tenant.id,
          subdomain: result.tenant.subdomain,
          name: result.tenant.name,
        },
        ...tokens,
      };
    } catch (err: any) {
      // Add strong logging to pinpoint root cause in production
      // eslint-disable-next-line no-console
      console.error('RegisterMerchant failed:', {
        message: err?.message,
        code: err?.code,
        meta: err?.meta,
      });

      // Map common Prisma errors to user-friendly HTTP errors
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          // Unique constraint failed
          const target = (err.meta && (err.meta as any).target) || [];
          if (Array.isArray(target) && target.includes('email')) {
            throw new ConflictException('Email already exists');
          }
          if (Array.isArray(target) && target.includes('phone')) {
            throw new ConflictException('رقم الهاتف مستخدم من قبل');
          }
          if (Array.isArray(target) && target.includes('subdomain')) {
            throw new ConflictException('Subdomain already taken');
          }
          throw new ConflictException('Duplicate value');
        }
        if (err.code === 'P2003') {
          // Foreign key constraint failed
          throw new BadRequestException('Invalid reference data');
        }
      }

      // Fallback
      throw new InternalServerErrorException('Registration failed');
    }
  }

  // Login - محسّن للأداء
  async login(email: string, password: string, clientIp?: string) {
    // استعلام محسّن: جلب البيانات الأساسية فقط أولاً
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isActive: true,
        loginAttempts: true,
        lockedUntil: true,
        tenantId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 🔒 Check if account is locked due to failed attempts
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `الحساب مقفل مؤقتاً بسبب محاولات تسجيل دخول فاشلة متعددة. يرجى المحاولة بعد ${minutesLeft} دقيقة.`,
      );
    }

    // التحقق من كلمة المرور أولاً قبل أي عمليات أخرى
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // 🔒 Increment failed login attempts (فقط عند فشل كلمة المرور)
      const newAttempts = user.loginAttempts + 1;
      const updateData: any = {
        loginAttempts: newAttempts,
      };

      // Lock account for 15 minutes after 5 failed attempts
      if (newAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 15);
        updateData.lockedUntil = lockUntil;
      }

      // تحديث سريع بدون await (fire and forget) لتسريع الاستجابة
      this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      }).catch(() => {}); // تجاهل الأخطاء في التحديث

      throw new UnauthorizedException('Invalid credentials');
    }

    // إذا كانت كلمة المرور صحيحة، نتحقق من حالة الحساب
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // جلب بيانات الـ tenant فقط عند نجاح تسجيل الدخول (تحسين الأداء)
    const tenant = user.tenantId ? await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        subdomain: true,
        name: true,
        status: true,
      },
    }) : null;

    // 🔒 Reset login attempts on successful login & update last login IP
    // تحديث سريع بدون انتظار (fire and forget)
    this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginIp: clientIp || 'unknown',
      },
    }).catch(() => {}); // تجاهل الأخطاء في التحديث

    // توليد الـ tokens
    const tokens = await this.generateTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: tenant,
      },
      ...tokens,
    };
  }

  // Refresh token
  async refreshToken(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.deleteMany({ where: { id: tokenRecord.id } }).catch(() => {});
      throw new UnauthorizedException('Refresh token expired');
    }

    const tokens = await this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.role,
    );

    // Delete old refresh token safely
    await this.prisma.refreshToken.deleteMany({ where: { id: tokenRecord.id } }).catch(() => {});

    return tokens;
  }

  // Logout
  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  // Generate JWT tokens
  private async generateTokens(userId: string, role: UserRole) {
    const payload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload);

    const signRefresh = () =>
      this.jwtService.sign({ ...payload, jti: randomUUID() }, {
        secret:
          this.config.get('JWT_REFRESH_SECRET') ||
          'Ra7ba_R3fr3sh_S3cr3t_2024_Change_This_Now!',
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      });

    let refreshToken = signRefresh();

    // Keep a single active refresh token per user to avoid collisions
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    // Store refresh token with one retry on unique collision
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
      await this.prisma.refreshToken.create({
        data: { token: refreshToken, userId, expiresAt },
      });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Regenerate and retry once
        refreshToken = signRefresh();
        await this.prisma.refreshToken.create({
          data: { token: refreshToken, userId, expiresAt },
        });
      } else {
        throw err;
      }
    }

    return { accessToken, refreshToken };
  }

  // Validate user (for strategies)
  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        tenant: {
          select: {
            id: true,
            subdomain: true,
            status: true,
          },
        },
      },
    });
  }

  // Forgot password - send reset code
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      // For security, don't reveal if email exists or not
      return { message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال كود إعادة التعيين' };
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Store reset code in database
    await this.prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        code: resetCode,
        expiresAt,
      },
    });

    // Send email
    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetCode,
        user.name,
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't throw error to not reveal if email exists
    }

    return { message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال كود إعادة التعيين' };
  }

  // Reset password with code
  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        code,
        expiresAt: { gt: new Date() },
        used: false,
      },
    });

    if (!resetRecord) {
      throw new BadRequestException('الكود غير صحيح أو منتهي الصلاحية');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark reset as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
    ]);

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }
}
