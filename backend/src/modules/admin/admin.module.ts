import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { VercelService } from '@/common/services/vercel.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, VercelService],
  exports: [AdminService],
})
export class AdminModule {}
