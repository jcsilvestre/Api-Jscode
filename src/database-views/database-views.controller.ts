import { Controller, Get, Param, Query } from '@nestjs/common';
import { DatabaseViewsService } from './database-views.service';

@Controller('database-views')
export class DatabaseViewsController {
  constructor(private readonly databaseViewsService: DatabaseViewsService) {}

  @Get('active-users')
  getActiveUsers() {
    return this.databaseViewsService.getActiveUsers();
  }

  @Get('active-users/:uuid')
  getActiveUserByUuid(@Param('uuid') uuid: string) {
    return this.databaseViewsService.getActiveUserByUuid(uuid);
  }

  @Get('groups-with-member-count')
  getGroupsWithMemberCount() {
    return this.databaseViewsService.getGroupsWithMemberCount();
  }

  @Get('groups-with-member-count/:id')
  getGroupWithMemberCountById(@Param('id') id: string) {
    return this.databaseViewsService.getGroupWithMemberCountById(id);
  }

  @Get('groups-with-member-count/tenant/:tenantName')
  getGroupsWithMemberCountByTenant(@Param('tenantName') tenantName: string) {
    return this.databaseViewsService.getGroupsWithMemberCountByTenant(tenantName);
  }

  @Get('tenant-stats')
  getTenantStats() {
    return this.databaseViewsService.getTenantStats();
  }

  @Get('tenant-stats/:id')
  getTenantStatsById(@Param('id') id: string) {
    return this.databaseViewsService.getTenantStatsById(id);
  }

  @Get('tenant-stats/slug/:slug')
  getTenantStatsBySlug(@Param('slug') slug: string) {
    return this.databaseViewsService.getTenantStatsBySlug(slug);
  }
}