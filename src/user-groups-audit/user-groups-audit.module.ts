import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGroupsAuditService } from './user-groups-audit.service';
import { UserGroupsAuditController } from './user-groups-audit.controller';
import { UserGroupsAudit } from './user-groups-audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserGroupsAudit])],
  controllers: [UserGroupsAuditController],
  providers: [UserGroupsAuditService],
  exports: [UserGroupsAuditService],
})
export class UserGroupsAuditModule {}