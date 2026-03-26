import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyDomainDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty()
  @IsString()
  domain: string;
}

export class ApproveDomainDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty()
  @IsString()
  domain: string;
}

export class RejectDomainDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class DomainStatusDto {
  @ApiProperty()
  domain: string;

  @ApiProperty()
  verified: boolean;

  @ApiProperty()
  approved: boolean;

  @ApiProperty()
  dnsRecords: {
    type: string;
    name: string;
    value: string;
    status: string;
  }[];
}
