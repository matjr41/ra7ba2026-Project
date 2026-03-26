import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { NotificationModule } from '../notification/notification.module';
import { MerchantModule } from '../merchant/merchant.module';

@Module({
  imports: [NotificationModule, MerchantModule],
  providers: [CronService],
})
export class CronModule {}
