import { Injectable } from '@nestjs/common';
import { YalidineService } from './providers/yalidine.service';
import { ZrExpressService } from './providers/zr-express.service';
import { JetExpressService } from './providers/jet-express.service';
import { DeliveryCompany } from '@prisma/client';

@Injectable()
export class DeliveryService {
  constructor(
    private yalidineService: YalidineService,
    private zrExpressService: ZrExpressService,
    private jetExpressService: JetExpressService,
  ) {}

  // Create shipment with selected delivery company
  async createShipment(company: DeliveryCompany, data: any) {
    switch (company) {
      case DeliveryCompany.YALIDINE:
        return this.yalidineService.createShipment(data);
      case DeliveryCompany.ZR_EXPRESS:
        return this.zrExpressService.createShipment(data);
      case DeliveryCompany.JET_EXPRESS:
        return this.jetExpressService.createShipment(data);
      default:
        throw new Error('Invalid delivery company');
    }
  }

  // Track shipment
  async trackShipment(company: DeliveryCompany, trackingNumber: string) {
    switch (company) {
      case DeliveryCompany.YALIDINE:
        return this.yalidineService.trackShipment(trackingNumber);
      case DeliveryCompany.ZR_EXPRESS:
        return this.zrExpressService.trackShipment(trackingNumber);
      case DeliveryCompany.JET_EXPRESS:
        return this.jetExpressService.trackShipment(trackingNumber);
      default:
        throw new Error('Invalid delivery company');
    }
  }

  // Get delivery rates
  async getRates(company: DeliveryCompany, wilaya: string) {
    switch (company) {
      case DeliveryCompany.YALIDINE:
        return this.yalidineService.getRates(wilaya);
      case DeliveryCompany.ZR_EXPRESS:
        return this.zrExpressService.getRates(wilaya);
      case DeliveryCompany.JET_EXPRESS:
        return this.jetExpressService.getRates(wilaya);
      default:
        throw new Error('Invalid delivery company');
    }
  }
}
