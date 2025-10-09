import { Controller, Post, Body, ValidationPipe, UseGuards, Res, Req, Get, Param, Delete } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { ResendTokenDto } from './dto/resend-token.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { LoginDto } from './dto/login.dto';
import { RouteProtectionGuard } from '../common/guards/route-protection.guard';
import { IpBlockingGuard } from '../common/guards/ip-blocking.guard';
import { BruteForceGuard } from '../common/guards/brute-force.guard';

@Controller('auth')
@UseGuards(RouteProtectionGuard, IpBlockingGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(BruteForceGuard)
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify')
  @UseGuards(BruteForceGuard)
  async verifyToken(@Body(ValidationPipe) verifyTokenDto: VerifyTokenDto) {
    return this.authService.verifyToken(verifyTokenDto);
  }

  @Post('complete-registration')
  @UseGuards(BruteForceGuard)
  async completeRegistration(
    @Body(ValidationPipe) completeRegistrationDto: CompleteRegistrationDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.completeRegistration(completeRegistrationDto);
    
    // Configurar cookies HttpOnly para tokens
    if (result.accessToken) {
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutos
      });
    }
    
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      });
    }
    
    // Retornar resposta sem tokens no body para segurança
    return {
      message: result.message,
      success: result.success
    };
  }

  @Post('login')
  @UseGuards(BruteForceGuard)
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    // Extrair informações da requisição
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await this.authService.login(loginDto, ipAddress, userAgent);
    
    // Configurar cookies HttpOnly para tokens
    if (result.accessToken) {
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutos
      });
    }
    
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      });
    }

    // Armazenar sessionId em cookie para rastreamento
    if (result.sessionId) {
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      });
    }
    
    // Retornar resposta sem tokens no body para segurança
    return {
      message: result.message,
      success: result.success
    };
  }

  @Post('resend')
  @UseGuards(BruteForceGuard)
  async resendToken(@Body(ValidationPipe) resendTokenDto: ResendTokenDto) {
    return this.authService.resendToken(resendTokenDto);
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const sessionId = req.cookies?.sessionId;
    
    // Invalidar sessão no banco de dados
    if (sessionId) {
      await this.authService.logout(sessionId);
    }
    
    // Limpar cookies de autenticação
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('sessionId');
    
    return {
      message: 'Logout realizado com sucesso!',
      success: true
    };
  }

  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.refreshToken;
    const sessionId = req.cookies?.sessionId;
    
    if (!refreshToken) {
      return {
        message: 'Token de refresh não encontrado',
        success: false
      };
    }

    try {
      const result = await this.authService.refreshToken(refreshToken, sessionId);
      
      // Configurar novos cookies HttpOnly
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutos
      });
      
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      });
      
      return {
        message: 'Tokens renovados com sucesso!',
        success: true
      };
    } catch (error) {
      // Limpar cookies inválidos
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.clearCookie('sessionId');
      
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
