import { Controller, Post, Body, ValidationPipe, UseGuards, Req, Get, Param, Delete } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RouteProtectionGuard } from '../common/guards/route-protection.guard';
import { IpBlockingGuard } from '../common/guards/ip-blocking.guard';
import { BruteForceGuard } from '../common/guards/brute-force.guard';

@Controller('auth/mobile')
@UseGuards(RouteProtectionGuard, IpBlockingGuard)
export class AuthMobileController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(BruteForceGuard)
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Req() req: Request
  ) {
    // Extrair informações da requisição
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await this.authService.login(loginDto, ipAddress, userAgent);
    
    // Para mobile, retornar tokens no body
    return {
      message: result.message,
      success: result.success,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
      expiresIn: 15 * 60, // 15 minutos em segundos
      refreshExpiresIn: 7 * 24 * 60 * 60 // 7 dias em segundos
    };
  }

  @Post('logout')
  async logout(@Body() body: { sessionId: string }) {
    const { sessionId } = body;
    
    // Invalidar sessão no banco de dados
    if (sessionId) {
      await this.authService.logout(sessionId);
    }
    
    return {
      message: 'Logout realizado com sucesso!',
      success: true
    };
  }

  @Post('refresh')
  async refreshToken(@Body() body: { refreshToken: string; sessionId?: string }) {
    const { refreshToken, sessionId } = body;
    
    if (!refreshToken) {
      return {
        message: 'Token de refresh não encontrado',
        success: false
      };
    }

    try {
      const result = await this.authService.refreshToken(refreshToken, sessionId);
      
      return {
        message: 'Tokens renovados com sucesso!',
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: 15 * 60, // 15 minutos em segundos
        refreshExpiresIn: 7 * 24 * 60 * 60 // 7 dias em segundos
      };
    } catch (error) {
      return {
        message: 'Token de refresh inválido ou expirado',
        success: false
      };
    }
  }

  @Get('sessions/:userId')
  async getActiveSessions(@Param('userId') userId: string) {
    return this.authService.getActiveSessions(userId);
  }

  @Delete('sessions/:userId/revoke-all')
  async revokeAllUserSessions(@Param('userId') userId: string) {
    return this.authService.revokeAllUserSessions(userId);
  }

  @Delete('sessions/:sessionId')
  async revokeSession(@Param('sessionId') sessionId: string) {
    return this.authService.logout(sessionId);
  }
}