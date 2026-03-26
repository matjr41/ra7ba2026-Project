import { IsOptional, IsString, IsObject, IsUrl } from 'class-validator';

export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameAr?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsOptional()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @IsUrl()
  banner?: string;

  @IsOptional()
  @IsUrl()
  favicon?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  telegramChatId?: string;

  @IsOptional()
  @IsObject()
  theme?: any;

  @IsOptional()
  @IsObject()
  checkoutConfig?: any;

  @IsOptional()
  @IsObject()
  storeFeatures?: {
    showFreeShipping?: boolean;
    showWarranty?: boolean;
    showSeasonalOffers?: boolean;
    showExclusiveDeals?: boolean;
    showFreeReturn?: boolean;
    warrantyDays?: number;
    freeShippingThreshold?: number;
    customFeatures?: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };

  @IsOptional()
  @IsString()
  thankYouMessage?: string;

  @IsOptional()
  @IsUrl()
  thankYouImage?: string;
}
