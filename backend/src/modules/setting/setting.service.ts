import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class SettingService {
  constructor(private prisma: PrismaService) {}

  async get(key: string): Promise<any> {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });
    return setting?.value;
  }

  async set(key: string, value: any, description?: string) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }

  async getAll() {
    return this.prisma.setting.findMany();
  }
}
