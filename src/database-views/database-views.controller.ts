import { Controller, Get, Param, Query } from '@nestjs/common';
import { DatabaseViewsService } from './database-views.service';

@Controller('dbv')
export class DatabaseViewsController {
  constructor(private readonly databaseViewsService: DatabaseViewsService) {}

  @Get()
  getAvailableViews() {
    return {
      message: 'Database Views API',
      endpoints: [
        'GET /v1/dbv/active-users - Lista usuários ativos',
        'GET /v1/dbv/active-users/:uuid - Busca usuário ativo por UUID',
        'GET /v1/dbv/groups-with-member-count - Lista grupos com contagem de membros',
        'GET /v1/dbv/groups-with-member-count/:id - Busca grupo por ID',
        'GET /v1/dbv/groups-with-member-count/tenant/:tenantName - Lista grupos por tenant',
        'GET /v1/dbv/tenant-stats - Estatísticas de tenants',
        'GET /v1/dbv/tenant-stats/:id - Estatísticas por ID',
        'GET /v1/dbv/tenant-stats/slug/:slug - Estatísticas por slug'
      ]
    };
  }

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