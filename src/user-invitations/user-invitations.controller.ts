import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserInvitationsService } from './user-invitations.service';
import { CreateUserInvitationDto } from './dto/create-user-invitation.dto';
import { UpdateUserInvitationDto } from './dto/update-user-invitation.dto';

@Controller('uiv')
export class UserInvitationsController {
  constructor(private readonly userInvitationsService: UserInvitationsService) {}

  @Post()
  create(@Body() createUserInvitationDto: CreateUserInvitationDto) {
    return this.userInvitationsService.create(createUserInvitationDto);
  }

  @Get()
  findAll() {
    return this.userInvitationsService.findAll();
  }

  @Get('tenant/:tenantId')
  findByTenant(@Param('tenantId') tenantId: string) {
    return this.userInvitationsService.findByTenant(tenantId);
  }

  @Get('pending')
  findPending(@Query('tenantId') tenantId?: string) {
    return this.userInvitationsService.findPending(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userInvitationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserInvitationDto: UpdateUserInvitationDto) {
    return this.userInvitationsService.update(id, updateUserInvitationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userInvitationsService.remove(id);
  }

  @Post('accept/:token')
  acceptInvitation(@Param('token') token: string) {
    return this.userInvitationsService.acceptInvitation(token);
  }

  @Post(':id/resend')
  resendInvitation(
    @Param('id') id: string,
    @Body('expires_at') expiresAt: string
  ) {
    return this.userInvitationsService.resendInvitation(id, new Date(expiresAt));
  }

  @Post('send')
  sendInvitation(
    @Body('email') email: string,
    @Body('tenant_id') tenantId: string,
    @Body('invited_by') invitedBy: string
  ) {
    return this.userInvitationsService.sendInvitation(email, tenantId, invitedBy);
  }
}