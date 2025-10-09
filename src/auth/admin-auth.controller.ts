import { 
  Controller, 
  Get, 
  Delete, 
  Param, 
  UseGuards, 
  Query,
  Post,
  Body,
  Logger 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminGuard } from '../common/guards/admin.guard';
import { RouteProtectionGuard } from '../common/guards/route-protection.guard';
import { IpBlockingGuard } from '../common/guards/ip-blocking.guard';

@Controller('auth/admin')
@UseGuards(RouteProtectionGuard, IpBlockingGuard, AdminGuard)
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get('sessions')
  async getAllActiveSessions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('userId') userId?: string,
  ) {
    this.logger.log(`Admin consultando sessões ativas - Página: ${page}, Limite: ${limit}`);
    
    return this.authService.getAllActiveSessionsForAdmin({
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
      userId,
    });
  }

  @Get('sessions/user/:userId')
  async getUserSessions(@Param('userId') userId: string) {
    this.logger.log(`Admin consultando sessões do usuário: ${userId}`);
    return this.authService.getActiveSessions(userId);
  }

  @Delete('sessions/user/:userId/revoke-all')
  async revokeAllUserSessions(@Param('userId') userId: string) {
    this.logger.log(`Admin revogando todas as sessões do usuário: ${userId}`);
    return this.authService.revokeAllUserSessions(userId);
  }

  @Delete('sessions/:sessionId')
  async revokeSpecificSession(@Param('sessionId') sessionId: string) {
    this.logger.log(`Admin revogando sessão específica: ${sessionId}`);
    return this.authService.logout(sessionId);
  }

  @Post('sessions/revoke-multiple')
  async revokeMultipleSessions(@Body('sessionIds') sessionIds: string[]) {
    this.logger.log(`Admin revogando múltiplas sessões: ${sessionIds.length} sessões`);
    
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      throw new Error('Lista de IDs de sessão é obrigatória');
    }

    const results = await Promise.allSettled(
      sessionIds.map(sessionId => this.authService.logout(sessionId))
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.length - successful;

    return {
      message: `Processamento concluído: ${successful} sucessos, ${failed} falhas`,
      successful,
      failed,
      total: results.length,
    };
  }

  @Get('sessions/suspicious')
  async getSuspiciousSessions(
    @Query('hours') hours: number = 24,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    this.logger.log(`Admin consultando sessões suspeitas das últimas ${hours} horas`);
    
    return this.authService.getSuspiciousSessionsForAdmin({
      hours: Math.max(1, Math.min(168, hours)), // Máximo 7 dias
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
    });
  }

  @Get('sessions/stats')
  async getSessionStats() {
    this.logger.log('Admin consultando estatísticas de sessões');
    return this.authService.getSessionStatsForAdmin();
  }
}