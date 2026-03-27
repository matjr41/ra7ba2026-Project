import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { AdminService } from './modules/admin/admin.service';
import * as express from 'express';
import * as path from 'path';
import { exec } from 'child_process';
import { DbUnavailableInterceptor } from './common/interceptors/db-unavailable.interceptor';

async function bootstrap() {
  console.log('🚀 Starting Rahba Backend...');
  console.log('📦 Node version:', process.version);
  console.log('💾 Memory limit:', process.env.NODE_OPTIONS || 'default');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  console.log('✅ NestJS application created');

  // Security
  app.use(helmet() as any);

  // Body size limits (fix PayloadTooLargeError for large JSON like rich text and images)
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

// CORS - Production-safe: only allow known origins
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://ra7ba.shop,https://www.ra7ba.shop')
  .split(',')
  .map((o: string) => o.trim())
  .filter(Boolean);

app.enableCors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('CORS: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
});

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global DB connectivity interceptor
  app.useGlobalInterceptors(new DbUnavailableInterceptor());

  // Global prefix
  app.setGlobalPrefix('api');

  // Simple health check endpoint
  app.getHttpAdapter().get('/', (req, res) => {
    res.status(200).send('OK');
  });
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.getHttpAdapter().get('/api', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Rahba API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Rahba API')
    .setDescription('Multi-Tenant E-commerce Platform for Algeria')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('admin', 'Super Admin endpoints')
    .addTag('merchant', 'Merchant dashboard endpoints')
    .addTag('store', 'Customer storefront endpoints')
    .addTag('products', 'Product management')
    .addTag('orders', 'Order management')
    .addTag('subscription', 'Subscription & billing')
    .addTag('delivery', 'Delivery integration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Serve local uploads directory (for StorageService local mode)
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Skip all maintenance tasks on boot to ensure fast startup
  console.log('⏭️ Skipping maintenance tasks on boot');


  const port = parseInt(process.env.PORT || '10000', 10);
  const host = '0.0.0.0'; // Bind to all network interfaces
  console.log(`🔌 Binding server on ${host}:${port}...`);
  
  await app.listen(port, host);

  console.log(`
  ✅✅✅ SERVER STARTED SUCCESSFULLY ✅✅✅
  🚀 Rahba Backend is running!
  📡 API: http://0.0.0.0:${port}/api
  📚 Docs: http://0.0.0.0:${port}/api/docs
  🔗 Health: http://0.0.0.0:${port}/health
  🇩🇿 صنع من طرف gribo abdo ❤️ ❤️
  `);

  // All migrations handled by Dockerfile - no post-startup tasks
  console.log('✅ Server ready to accept connections');
}

bootstrap().catch((error) => {
  console.error('❌❌❌ FATAL ERROR DURING BOOTSTRAP ❌❌❌');
  console.error('Error:', error);
  console.error('Stack:', error?.stack);
  process.exit(1);
});
