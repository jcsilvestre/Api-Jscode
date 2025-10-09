import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { EnhancedThrottlerGuard } from './common/guards/enhanced-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minuto
      limit: 100, // 100 tentativas por minuto por IP (conforme solicitado)
    }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_DATABASE || 'postgres',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development' && process.env.DB_SYNCHRONIZE === 'true',
      migrationsRun: process.env.NODE_ENV !== 'development',
      logging: process.env.NODE_ENV === 'development' ? true : ['error', 'warn'],
      ssl: false,
      retryAttempts: 3,
      retryDelay: 3000,
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
    AuthModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: EnhancedThrottlerGuard,
    },
  ],
})
export class AppModule {}
