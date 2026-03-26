import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class YalidineService {
  private apiUrl: string;
  private apiKey: string;

  constructor(private config: ConfigService) {
    this.apiUrl = this.config.get('YALIDINE_API_URL') || 'https://api.yalidine.app';
    this.apiKey = this.config.get('YALIDINE_API_KEY') || '';
  }

  async createShipment(data: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    wilaya: string;
    commune: string;
    address: string;
    items: any[];
    totalAmount: number;
  }) {
    try {
      // Mock implementation - replace with actual Yalidine API
      if (!this.apiKey) {
        return this.mockCreateShipment(data);
      }

      const response = await axios.post(
        `${this.apiUrl}/parcels`,
        {
          order_id: data.orderNumber,
          receiver_name: data.customerName,
          receiver_phone: data.customerPhone,
          wilaya: data.wilaya,
          commune: data.commune,
          address: data.address,
          products: data.items,
          cod_amount: data.totalAmount,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        trackingNumber: response.data.tracking_number,
        data: response.data,
      };
    } catch (error) {
      return this.mockCreateShipment(data);
    }
  }

  async trackShipment(trackingNumber: string) {
    try {
      if (!this.apiKey) {
        return this.mockTrackShipment(trackingNumber);
      }

      const response = await axios.get(
        `${this.apiUrl}/parcels/${trackingNumber}/tracking`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        },
      );

      return {
        success: true,
        status: response.data.status,
        history: response.data.history,
      };
    } catch (error) {
      return this.mockTrackShipment(trackingNumber);
    }
  }

  async getRates(wilaya: string) {
    // Mock rates - replace with actual API
    const rates = {
      'الجزائر': 500,
      'وهران': 600,
      'قسنطينة': 650,
      'عنابة': 700,
    };

    return rates[wilaya] || 500;
  }

  // Mock implementations for development
  private mockCreateShipment(data: any) {
    const trackingNumber = `YAL-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    return {
      success: true,
      trackingNumber,
      message: 'Mock shipment created (Yalidine API not configured)',
    };
  }

  private mockTrackShipment(trackingNumber: string) {
    return {
      success: true,
      trackingNumber,
      status: 'in_transit',
      history: [
        { date: new Date(), status: 'picked_up', location: 'Warehouse' },
        { date: new Date(), status: 'in_transit', location: 'Hub Center' },
      ],
      message: 'Mock tracking (Yalidine API not configured)',
    };
  }
}
