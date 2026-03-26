import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMarketingDto {
  @ApiPropertyOptional()
  facebookPixelId?: string;

  @ApiPropertyOptional()
  facebookAccessToken?: string;

  @ApiPropertyOptional()
  facebookEnabled?: boolean;

  @ApiPropertyOptional()
  tiktokPixelId?: string;

  @ApiPropertyOptional()
  tiktokAccessToken?: string;

  @ApiPropertyOptional()
  tiktokEnabled?: boolean;

  @ApiPropertyOptional()
  googleAnalyticsId?: string;

  @ApiPropertyOptional()
  googleSheetsId?: string;

  @ApiPropertyOptional()
  googleServiceAccount?: any;

  @ApiPropertyOptional()
  googleEnabled?: boolean;

  @ApiPropertyOptional()
  snapchatPixelId?: string;

  @ApiPropertyOptional()
  snapchatEnabled?: boolean;
}
