import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantOwnershipHistoryService } from './tenant-ownership-history.service';
import { TenantOwnershipHistoryController } from './tenant-ownership-history.controller';
import { TenantOwnershipHistory } from './tenant-ownership-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TenantOwnershipHistory])],
  controllers: [TenantOwnershipHistoryController],
  providers: [TenantOwnershipHistoryService],
  exports: [TenantOwnershipHistoryService],
})
export class TenantOwnershipHistoryModule {}