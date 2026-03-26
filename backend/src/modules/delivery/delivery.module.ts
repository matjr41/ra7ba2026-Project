import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { YalidineService } from './providers/yalidine.service';
import { ZrExpressService } from './providers/zr-express.service';
import { JetExpressService } from './providers/jet-express.service';

@Module({
  providers: [
    DeliveryService,
    YalidineService,
    ZrExpressService,
    JetExpressService,
  ],
  exports: [DeliveryService],
})
export class DeliveryModule {}
