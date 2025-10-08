import { IsString, IsEmail, IsUUID, IsDateString, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateUserInvitationDto {
  @IsNotEmpty()
  @IsUUID()
  tenantId: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(120)
  email: string;

  @IsNotEmpty()
  @IsUUID()
  invitedBy: string;

  @IsNotEmpty()
  @IsDateString()
  expiresAt: string;
}