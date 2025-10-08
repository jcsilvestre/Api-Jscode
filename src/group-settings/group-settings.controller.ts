import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { GroupSettingsService } from './group-settings.service';
import { CreateGroupSettingsDto } from './dto/create-group-settings.dto';
import { UpdateGroupSettingsDto } from './dto/update-group-settings.dto';

@Controller('gpcfg')
export class GroupSettingsController {
  constructor(private readonly groupSettingsService: GroupSettingsService) {}

  @Post()
  create(@Body() createGroupSettingsDto: CreateGroupSettingsDto) {
    return this.groupSettingsService.create(createGroupSettingsDto);
  }

  @Get()
  findAll() {
    return this.groupSettingsService.findAll();
  }

  @Get('tenant/:tenantId')
  findByTenant(@Param('tenantId') tenantId: string) {
    return this.groupSettingsService.findByTenant(tenantId);
  }

  @Get(':groupId')
  findOne(@Param('groupId') groupId: string) {
    return this.groupSettingsService.findOne(groupId);
  }

  @Patch(':groupId')
  update(@Param('groupId') groupId: string, @Body() updateGroupSettingsDto: UpdateGroupSettingsDto) {
    return this.groupSettingsService.update(groupId, updateGroupSettingsDto);
  }

  @Delete(':groupId')
  remove(@Param('groupId') groupId: string) {
    return this.groupSettingsService.remove(groupId);
  }

  @Put(':groupId/set-default')
  setAsDefault(@Param('groupId') groupId: string) {
    return this.groupSettingsService.setAsDefault(groupId);
  }
}