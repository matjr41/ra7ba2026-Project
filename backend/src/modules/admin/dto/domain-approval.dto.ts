import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class ApproveDomainDto {
  @IsString()
  tenantId: string;

  @IsString()
  domain: string;
}

export class RejectDomainDto {
  @IsString()
  tenantId: string;

  @IsString()
  reason: string;
}

export class DomainListDto {
  @IsString()
  id: string;
  
  @IsString()
  domain: string;
  
  @IsString()
  tenantId: string;
  
  @IsString()
  tenantName: string;
  
  @IsBoolean()
  isVerified: boolean;
  
  @IsString()
  @IsOptional()
  status?: string;
  
  @IsString()
  @IsOptional()
  error?: string;
  
  @IsString()
  @IsOptional()
  requestedAt?: string;
  
  @IsString()
  @IsOptional()
  verifiedAt?: string;
}
