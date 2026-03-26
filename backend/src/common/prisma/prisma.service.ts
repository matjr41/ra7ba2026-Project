import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const raw = process.env.DB_URL_OVERRIDE || process.env.DATABASE_URL || '';
    let finalUrl = raw;
    
    console.log('🔧 Initializing PrismaService...');
    
    try {
      const u = new URL(raw);
      const forceDirect = String(process.env.DB_FORCE_DIRECT ?? 'false').toLowerCase() === 'true';
      if (forceDirect) {
        // Force direct connection (standard Postgres on 5432)
        if (!u.port) {
          u.port = '5432';
        }
        if (!u.searchParams.get('sslmode')) {
          u.searchParams.set('sslmode', 'require');
        }
        finalUrl = u.toString();
      }
      console.log(`🗄️ Prisma datasource -> host: ${u.hostname}, port: ${u.port || '5432'}`);
    } catch (err) {
      console.error('⚠️ Failed to parse DATABASE_URL:', err);
    }

    super({
      log: ['error', 'warn'],
      datasources: { db: { url: finalUrl } },
    });

    const maxQueryRetries = parseInt(process.env.DB_QUERY_RETRIES || '10', 10);
    const queryRetryDelayMs = parseInt(process.env.DB_QUERY_RETRY_DELAY_MS || '2000', 10);
    try {
      const anyClient: any = this as any;
      if (typeof anyClient.$use === 'function') {
        anyClient.$use(async (params: any, next: any) => {
          let lastErr: any;
          for (let attempt = 1; attempt <= maxQueryRetries; attempt++) {
            try {
              return await next(params);
            } catch (err: any) {
              lastErr = err;
              const msg = err?.message || String(err);
              const code = err?.code || err?.errorCode || err?.name;
              const isTransient =
                code === 'P1001' ||
                code === 'PrismaClientInitializationError' ||
                code === 'ConnectionClosed' ||
                msg.includes("Can't reach database server") ||
                msg.includes('ECONN') ||
                msg.includes('ENETUNREACH') ||
                msg.includes('ETIMEDOUT') ||
                msg.includes('Connection closed') ||
                msg.includes('Connection terminated');
              if (isTransient && attempt < maxQueryRetries) {
                await new Promise((res) => setTimeout(res, queryRetryDelayMs));
                continue;
              }
              throw err;
            }
          }
          throw lastErr;
        });
      }
    } catch {}
  }

  async onModuleInit() {
    // Skip DB connection on boot - connect on first query instead
    console.log('⏭️ Skipping initial DB connect - will connect on first query');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Tenant-aware query helper
  async withTenant<T>(tenantId: string, operation: () => Promise<T>): Promise<T> {
    return operation();
  }

  // Clean database (for testing)
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => key[0] !== '_' && key !== 'constructor',
    );

    return Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as string];
        if (model && typeof model.deleteMany === 'function') {
          return model.deleteMany();
        }
      }),
    );
  }
}
