import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PlanFeaturesDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(-1)
  maxProducts: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(-1)
  maxOrders: number;

  @ApiProperty()
  @IsBoolean()
  variants: boolean;

  @ApiProperty()
  @IsBoolean()
  bulkPricing: boolean;

  @ApiProperty()
  @IsBoolean()
  reviews: boolean;

  @ApiProperty()
  @IsBoolean()
  seasonalOffers: boolean;

  @ApiProperty()
  @IsBoolean()
  advancedSEO: boolean;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  multipleImages: number;

  @ApiProperty()
  @IsBoolean()
  customDomain: boolean;

  @ApiProperty()
  @IsBoolean()
  prioritySupport: boolean;
}

export class UpdatePlanFeaturesDto {
  @ApiProperty({ enum: ['FREE', 'STANDARD', 'PRO'] })
  plan: 'FREE' | 'STANDARD' | 'PRO';

  @ApiProperty({ type: PlanFeaturesDto })
  features: PlanFeaturesDto;
}
