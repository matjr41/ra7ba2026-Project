// Shim for @prisma/client to allow building without a generated Prisma schema
// Provides enums and error class used by the codebase.

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MERCHANT = 'MERCHANT',
  CUSTOMER = 'CUSTOMER',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  TRIAL = 'TRIAL',
}

export enum DeliveryCompany {
  YALIDINE = 'YALIDINE',
  ZR_EXPRESS = 'ZR_EXPRESS',
  JET_EXPRESS = 'JET_EXPRESS',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum SubscriptionPlan {
  STANDARD = 'STANDARD',
  PRO = 'PRO',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class PrismaClientKnownRequestError extends Error {
  code?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message?: string, code?: string, meta?: any) {
    super(message);
    this.code = code;
    this.meta = meta;
  }
}
