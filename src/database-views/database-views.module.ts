import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseViewsController } from './database-views.controller';
import { DatabaseViewsService } from './database-views.service';
import { ActiveUser } from './entities/active-user.entity';
import { GroupWithMemberCount } from './entities/group-with-member-count.entity';
import { TenantStats } from './entities/tenant-stats.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActiveUser,
      GroupWithMemberCount,
      TenantStats
    ])
  ],
  controllers: [DatabaseViewsController],
  providers: [DatabaseViewsService],
  exports: [DatabaseViewsService]
})
export class DatabaseViewsModule {}