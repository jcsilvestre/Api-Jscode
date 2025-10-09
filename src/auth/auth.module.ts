import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthMobileController } from './auth-mobile.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './services/email.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AdminGuard } from '../common/guards/admin.guard';
import { UserToken } from './entities/user-token.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { UserSession } from '../user-sessions/user-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserToken, User, Tenant, UserSession]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AuthMobileController, AdminAuthController],
  providers: [AuthService, EmailService, JwtStrategy, AdminGuard],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
