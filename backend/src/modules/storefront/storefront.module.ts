import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { TelegramService } from '@/common/services/telegram.service';

@Module({
  imports: [PrismaModule],
  controllers: [StorefrontController],
  providers: [StorefrontService, TelegramService],
  exports: [StorefrontService],
})
export class StorefrontModule {}
