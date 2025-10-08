import { Controller, Get, Post, Body, Param, Delete, Patch, Logger } from '@nestjs/common';
import { UserGroupsService } from './user-groups.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';

@Controller('ugx')
export class UserGroupsController {
  private readonly logger = new Logger(UserGroupsController.name);

  constructor(private readonly userGroupsService: UserGroupsService) {}

  @Post()
  create(@Body() createUserGroupDto: CreateUserGroupDto) {
    return this.userGroupsService.create(createUserGroupDto);
  }

  @Get()
  findAll() {
    return this.userGroupsService.findAll();
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    try {
      this.logger.log(`Finding user groups for userId: ${userId}`);
      // userId is now a UUID string, no need to parse as integer
      const result = await this.userGroupsService.findByUser(userId);
      this.logger.log(`Found ${result.length} groups for user ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error finding user groups for userId ${userId}:`, error);
      throw error;
    }
  }

  @Get('group/:groupId')
  findByGroup(@Param('groupId') groupId: string) {
    return this.userGroupsService.findByGroup(groupId);
  }

  @Get('group/:groupId/count')
  getGroupMemberCount(@Param('groupId') groupId: string) {
    return this.userGroupsService.getGroupMemberCount(groupId);
  }

  @Get('tenant/:tenantId')
  getUsersByTenant(@Param('tenantId') tenantId: string) {
    return this.userGroupsService.getUsersByTenant(tenantId);
  }

  @Get(':userId/:groupId')
  findOne(@Param('userId') userId: string, @Param('groupId') groupId: string) {
    return this.userGroupsService.findOne(userId, groupId);
  }

  @Patch(':userId/:groupId')
  update(
    @Param('userId') userId: string, 
    @Param('groupId') groupId: string,
    @Body() updateUserGroupDto: UpdateUserGroupDto
  ) {
    return this.userGroupsService.update(userId, groupId, updateUserGroupDto);
  }

  @Delete(':userId/:groupId')
  remove(@Param('userId') userId: string, @Param('groupId') groupId: string) {
    return this.userGroupsService.remove(userId, groupId);
  }

  @Delete('user/:userId/all')
  removeUserFromAllGroups(@Param('userId') userId: string) {
    return this.userGroupsService.removeUserFromAllGroups(userId);
  }

  @Delete('group/:groupId/all')
  removeAllUsersFromGroup(@Param('groupId') groupId: string) {
    return this.userGroupsService.removeAllUsersFromGroup(groupId);
  }
}