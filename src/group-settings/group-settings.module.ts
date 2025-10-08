import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupSettingsService } from './group-settings.service';
import { GroupSettingsController } from './group-settings.controller';
import { GroupSettings } from './group-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GroupSettings])],
  controllers: [GroupSettingsController],
  providers: [GroupSettingsService],
  exports: [GroupSettingsService],
})
export class GroupSettingsModule {}