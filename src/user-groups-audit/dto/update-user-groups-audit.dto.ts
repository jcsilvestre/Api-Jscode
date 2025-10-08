import { PartialType } from '@nestjs/mapped-types';
import { CreateUserGroupsAuditDto } from './create-user-groups-audit.dto';

export class UpdateUserGroupsAuditDto extends PartialType(CreateUserGroupsAuditDto) {}