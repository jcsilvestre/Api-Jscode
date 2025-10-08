import { IsUUID, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateTenantOwnershipHistoryDto {
  @IsNotEmpty()
  @IsUUID()
  tenantId: string;

  @IsOptional()
  @IsUUID()
  previousOwner?: string;

  @IsNotEmpty()
  @IsUUID()
  newOwner: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsUUID()
  transferredBy?: string;
}