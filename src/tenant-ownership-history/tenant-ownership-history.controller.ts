import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TenantOwnershipHistoryService } from './tenant-ownership-history.service';
import { CreateTenantOwnershipHistoryDto } from './dto/create-tenant-ownership-history.dto';
import { UpdateTenantOwnershipHistoryDto } from './dto/update-tenant-ownership-history.dto';

@Controller('toh')
export class TenantOwnershipHistoryController {
  constructor(private readonly tenantOwnershipHistoryService: TenantOwnershipHistoryService) {}

  @Post()
  create(@Body() createTenantOwnershipHistoryDto: CreateTenantOwnershipHistoryDto) {
    return this.tenantOwnershipHistoryService.create(createTenantOwnershipHistoryDto);
  }

  @Get()
  findAll() {
    return this.tenantOwnershipHistoryService.findAll();
  }

  @Get('tenant/:tenantId')
  findByTenant(@Param('tenantId') tenantId: string) {
    return this.tenantOwnershipHistoryService.findByTenant(tenantId);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.tenantOwnershipHistoryService.findByUser(userId);
  }

  @Get('history')
  getOwnershipHistory(
    @Query('tenantId') tenantId?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: number
  ) {
    return this.tenantOwnershipHistoryService.getOwnershipHistory(tenantId, userId, limit);
  }

  @Get('current-owner/:tenantId')
  getCurrentOwner(@Param('tenantId') tenantId: string) {
    return this.tenantOwnershipHistoryService.getCurrentOwner(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantOwnershipHistoryService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTenantOwnershipHistoryDto: UpdateTenantOwnershipHistoryDto) {
    return this.tenantOwnershipHistoryService.update(id, updateTenantOwnershipHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tenantOwnershipHistoryService.remove(id);
  }

  @Post('log-change')
  logOwnershipChange(
    @Body('tenant_id') tenantId: string,
    @Body('previous_owner') previousOwner: string,
    @Body('new_owner') newOwner: string,
    @Body('transferred_by') transferredBy?: string,
    @Body('reason') reason?: string
  ) {
    return this.tenantOwnershipHistoryService.createOwnershipTransfer(
      tenantId,
      previousOwner,
      newOwner,
      transferredBy,
      reason
    );
  }
}