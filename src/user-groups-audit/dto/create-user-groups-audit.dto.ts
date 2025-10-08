import { IsUUID, IsString, IsIn, IsNotEmpty } from 'class-validator';

export class CreateUserGroupsAuditDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  groupId: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['added', 'removed'])
  action: string;

  @IsNotEmpty()
  @IsUUID()
  performedBy: string;
}