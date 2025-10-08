import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { UserGroupsAuditService } from './user-groups-audit.service';
import { CreateUserGroupsAuditDto } from './dto/create-user-groups-audit.dto';
import { UpdateUserGroupsAuditDto } from './dto/update-user-groups-audit.dto';

@Controller('uga')
export class UserGroupsAuditController {
  private readonly logger = new Logger(UserGroupsAuditController.name);

  constructor(private readonly userGroupsAuditService: UserGroupsAuditService) {}

  @Post()
  async create(@Body() createUserGroupsAuditDto: CreateUserGroupsAuditDto) {
    try {
      this.logger.log(`Creating user groups audit: ${JSON.stringify(createUserGroupsAuditDto)}`);
      const result = await this.userGroupsAuditService.create(createUserGroupsAuditDto);
      this.logger.log(`User groups audit created successfully: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error creating user groups audit: ${error.message}`, error.stack);
      throw new HttpException('Failed to create user groups audit', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  findAll() {
    return this.userGroupsAuditService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.userGroupsAuditService.findByUser(userId);
  }

  @Get('group/:groupId')
  findByGroup(@Param('groupId') groupId: string) {
    return this.userGroupsAuditService.findByGroup(groupId);
  }

  @Get('action/:action')
  findByAction(@Param('action') action: string) {
    return this.userGroupsAuditService.findByAction(action);
  }

  @Get('performer/:performedBy')
  findByPerformer(@Param('performedBy') performedBy: string) {
    return this.userGroupsAuditService.findByPerformer(performedBy);
  }

  @Get('history')
  getAuditHistory(
    @Query('userId') userId?: string,
    @Query('groupId') groupId?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: number
  ) {
    return this.userGroupsAuditService.getAuditHistory(userId, groupId, action, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userGroupsAuditService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserGroupsAuditDto: UpdateUserGroupsAuditDto) {
    return this.userGroupsAuditService.update(id, updateUserGroupsAuditDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userGroupsAuditService.remove(id);
  }

  @Post('log-action')
  logUserGroupAction(
    @Body('user_id') userId: string,
    @Body('group_id') groupId: string,
    @Body('action') action: 'added' | 'removed',
    @Body('performed_by') performedBy: string
  ) {
    return this.userGroupsAuditService.logUserGroupChange(userId, groupId, action, performedBy);
  }
}