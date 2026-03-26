import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// بلدية داخل الولاية
export class CommuneDto {
  @IsString()
  id: string; // معرف البلدية

  @IsString()
  name: string; // اسم البلدية بالعربية

  @IsString()
  @IsOptional()
  postalCode?: string; // الرمز البريدي
}

// تكوين أسعار الشحن لولاية واحدة
export class WilayaShippingDto {
  @IsString()
  wilayaCode: string; // 01-58

  @IsString()
  wilayaName: string; // اسم الولاية بالعربية

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommuneDto)
  @IsOptional()
  communes?: CommuneDto[]; // قائمة بلديات الولاية

  @IsNumber()
  @IsOptional()
  homeDeliveryPrice?: number; // سعر التوصيل للمنزل (اختياري)

  @IsNumber()
  @IsOptional()
  deskDeliveryPrice?: number; // سعر التوصيل لمكتب الشحن (اختياري)

  @IsBoolean()
  freeShipping: boolean; // شحن مجاني

  @IsBoolean()
  @IsOptional()
  isActive?: boolean; // تفعيل/تعطيل الشحن لهذه الولاية
}

// تكوين شركة شحن
export class ShippingCompanyDto {
  @IsString()
  id: string;

  @IsString()
  name: string; // اسم الشركة

  @IsString()
  @IsOptional()
  apiKey?: string; // مفتاح API

  @IsString()
  @IsOptional()
  apiSecret?: string; // سر API

  @IsString()
  @IsOptional()
  webhookUrl?: string; // رابط Webhook

  @IsBoolean()
  isActive: boolean; // مفعل أم لا

  @IsString()
  @IsOptional()
  notes?: string; // ملاحظات
}

// DTO الرئيسي لتحديث إعدادات الشحن
export class UpdateShippingConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WilayaShippingDto)
  @IsOptional()
  wilayas?: WilayaShippingDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingCompanyDto)
  @IsOptional()
  shippingCompanies?: ShippingCompanyDto[];

  @IsBoolean()
  @IsOptional()
  enableHomeDelivery?: boolean; // تفعيل التوصيل للمنزل

  @IsBoolean()
  @IsOptional()
  enableDeskDelivery?: boolean; // تفعيل التوصيل لمكتب الشحن

  @IsNumber()
  @IsOptional()
  defaultHomeDeliveryPrice?: number; // السعر الافتراضي للتوصيل للمنزل

  @IsNumber()
  @IsOptional()
  defaultDeskDeliveryPrice?: number; // السعر الافتراضي لمكتب الشحن
}
