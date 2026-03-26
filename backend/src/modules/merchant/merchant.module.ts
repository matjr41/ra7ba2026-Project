import { Module } from '@nestjs/common';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';
import { VercelService } from '@/common/services/vercel.service';
import { RenderDomainService } from '@/common/services/render-domain.service';

@Module({
  controllers: [MerchantController],
  providers: [MerchantService, VercelService, RenderDomainService],
  exports: [MerchantService],
})
export class MerchantModule {}
