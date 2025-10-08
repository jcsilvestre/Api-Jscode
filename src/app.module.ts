import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { GroupsModule } from './groups/groups.module';
import { GroupSettingsModule } from './group-settings/group-settings.module';
import { UserGroupsModule } from './user-groups/user-groups.module';
import { UserInvitationsModule } from './user-invitations/user-invitations.module';
import { UserSessionsModule } from './user-sessions/user-sessions.module';
import { UserGroupsAuditModule } from './user-groups-audit/user-groups-audit.module';
import { TenantOwnershipHistoryModule } from './tenant-ownership-history/tenant-ownership-history.module';
import { EmailModule } from './email/email.module';
import { DatabaseViewsModule } from './database-views/database-views.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_DATABASE || 'jcscode',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production' ? (process.env.DB_SYNCHRONIZE === 'true') : false,
      logging: process.env.DB_LOGGING === 'true' || true, // Enable logging to see SQL queries and errors
    }),
    UsersModule,
    TenantsModule,
    GroupsModule,
    GroupSettingsModule,
    UserGroupsModule,
    UserInvitationsModule,
    UserSessionsModule,
    UserGroupsAuditModule,
    TenantOwnershipHistoryModule,
    EmailModule,
    DatabaseViewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
