import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantOwnershipHistoryDto } from './create-tenant-ownership-history.dto';

export class UpdateTenantOwnershipHistoryDto extends PartialType(CreateTenantOwnershipHistoryDto) {}