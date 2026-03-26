import { ApiProperty } from '@nestjs/swagger';

export class MarketingIntegrationResponseDto {
  @ApiProperty({ description: 'Facebook Pixel ID' })
  facebookPixelId?: string;

  @ApiProperty({ description: 'Facebook Pixel enabled status' })
  facebookEnabled: boolean;

  @ApiProperty({ description: 'TikTok Pixel ID' })
  tiktokPixelId?: string;

  @ApiProperty({ description: 'TikTok Pixel enabled status' })
  tiktokEnabled: boolean;

  @ApiProperty({ description: 'Google Analytics ID' })
  googleAnalyticsId?: string;

  @ApiProperty({ description: 'Google Sheets ID for orders' })
  googleSheetsId?: string;

  @ApiProperty({ description: 'Google integration enabled status' })
  googleEnabled: boolean;

  @ApiProperty({ description: 'Snapchat Pixel ID' })
  snapchatPixelId?: string;

  @ApiProperty({ description: 'Snapchat Pixel enabled status' })
  snapchatEnabled: boolean;

  @ApiProperty({ description: 'Last updated timestamp' })
  updatedAt: Date;
}
