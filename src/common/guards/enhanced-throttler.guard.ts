import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';

// Decorator para configurar rate limiting específico
export const THROTTLE_SENSITIVE = 'throttle_sensitive';
export const ThrottleSensitive = (limit: number, ttl: number) => 
  Reflect.defineMetadata(THROTTLE_SENSITIVE, { limit, ttl }, Reflect);

@Injectable()
export class EnhancedThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Request): Promise<string> {
    // Usar IP + User Agent + Rota para tracking mais preciso
    const ip = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const route = req.route?.path || req.url;
    
    // Hash simples para criar identificador único
    return `${ip}:${this.hashString(userAgent)}:${route}`;
  }

  protected getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    const cfConnectingIp = request.headers['cf-connecting-ip'] as string;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp;
    }
    
    if (cfConnectingIp) {
      return cfConnectingIp;
    }
    
    return request.ip || request.connection.remoteAddress || 'unknown';
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    
    // Whitelist de IPs que não devem ser limitados
    const whitelistIps = [
      '127.0.0.1',
      '::1',
      'localhost',
      '192.168.1.11', // IP específico do usuário
    ];
    
    // Verificar se é IP local
    const localIpPatterns = [
      /^192\.168\.\d{1,3}\.\d{1,3}$/,
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
    ];
    
    if (whitelistIps.includes(ip) || localIpPatterns.some(pattern => pattern.test(ip))) {
      return true; // Pular rate limiting para IPs whitelistados
    }
    
    return super.shouldSkip(context);
  }

  protected async getThrottlerConfig(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const route = request.route?.path || request.url;
    
    // Configurações específicas por tipo de rota
    const sensitiveRouteConfigs = {
      // Rotas de autenticação - mais restritivas
      '/auth/login': { limit: 5, ttl: 300000 }, // 5 tentativas por 5 minutos
      '/auth/register': { limit: 3, ttl: 600000 }, // 3 tentativas por 10 minutos
      '/auth/verify': { limit: 10, ttl: 300000 }, // 10 tentativas por 5 minutos
      '/auth/resend': { limit: 2, ttl: 600000 }, // 2 tentativas por 10 minutos
      
      // Rotas de usuários - moderadamente restritivas
      '/umx': { limit: 20, ttl: 60000 }, // 20 tentativas por minuto
      
      // Rotas administrativas - muito restritivas
      '/admin': { limit: 10, ttl: 300000 }, // 10 tentativas por 5 minutos
      '/config': { limit: 5, ttl: 300000 }, // 5 tentativas por 5 minutos
    };
    
    // Verificar se a rota atual tem configuração específica
    for (const [routePattern, config] of Object.entries(sensitiveRouteConfigs)) {
      if (route.includes(routePattern)) {
        return [config];
      }
    }
    
    // Verificar metadata customizada
    const sensitiveConfig = this.reflector.get(THROTTLE_SENSITIVE, context.getHandler());
    if (sensitiveConfig) {
      return [sensitiveConfig];
    }
    
    // Configuração padrão baseada no método HTTP
    const method = request.method;
    switch (method) {
      case 'POST':
        return [{ limit: 30, ttl: 60000 }]; // 30 POSTs por minuto
      case 'PUT':
      case 'PATCH':
        return [{ limit: 20, ttl: 60000 }]; // 20 updates por minuto
      case 'DELETE':
        return [{ limit: 10, ttl: 60000 }]; // 10 deletes por minuto
      case 'GET':
      default:
        return [{ limit: 100, ttl: 60000 }]; // 100 GETs por minuto
    }
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const route = request.route?.path || request.url;
    const method = request.method;
    
    // Log detalhado do rate limiting
    console.error(`🚫 RATE LIMIT EXCEEDED: ${method} ${route} - IP: ${ip} - Time: ${new Date().toISOString()}`);
    
    throw new ThrottlerException('Rate limit exceeded. Please try again later.');
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}