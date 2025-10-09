import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RouteProtectionGuard implements CanActivate {
  private readonly logger = new Logger(RouteProtectionGuard.name);

  // Rotas que devem ser bloqueadas para listagem pública
  private readonly blockedRoutes = [
    '/_debug',
    '/debug',
    '/admin',
    '/swagger',
    '/api-docs',
    '/docs',
    '/health',
    '/metrics',
    '/status',
    '/info',
    '/actuator',
    '/management',
    '/.env',
    '/config',
    '/phpinfo',
    '/wp-admin',
    '/wp-login',
    '/phpmyadmin',
    '/adminer',
    '/database',
    '/db',
    '/backup',
    '/logs',
    '/log',
    '/tmp',
    '/temp',
    '/cache',
    '/uploads',
    '/files',
    '/assets/config',
    '/api/debug',
    '/api/admin',
    '/v1/debug',
    '/v1/admin',
    '/v1/config',
    '/v1/system',
    '/v1/internal',
  ];

  // Padrões de URL suspeitos
  private readonly suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /\/\./,  // Hidden files
    /\.(env|config|ini|conf|log|bak|backup|sql|db)$/i,  // Arquivos sensíveis
    /\/(etc|proc|sys|var|usr|root|home)\//,  // Diretórios do sistema
    /\/(wp-|admin|phpmyadmin|adminer)/i,  // Padrões de CMS/Admin
    /\.(php|asp|jsp|cgi)$/i,  // Scripts server-side
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';

    // Verificar rotas bloqueadas
    const isBlockedRoute = this.blockedRoutes.some(route => 
      url.toLowerCase().startsWith(route.toLowerCase())
    );

    if (isBlockedRoute) {
      this.logger.warn(
        `🚫 Tentativa de acesso a rota bloqueada: ${method} ${url} - IP: ${ip} - UserAgent: ${userAgent}`
      );
      
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Acesso negado a este recurso',
        timestamp: new Date().toISOString(),
        path: url,
        method: method,
      });
    }

    // Verificar padrões suspeitos
    const isSuspicious = this.suspiciousPatterns.some(pattern => 
      pattern.test(url)
    );

    if (isSuspicious) {
      this.logger.error(
        `🚨 Tentativa de acesso suspeito detectada: ${method} ${url} - IP: ${ip} - UserAgent: ${userAgent}`
      );
      
      // Log detalhado para análise de segurança
      this.logger.error('Detalhes da tentativa suspeita:', {
        ip,
        method,
        url,
        userAgent,
        timestamp: new Date().toISOString(),
        headers: this.sanitizeHeaders(headers),
      });
      
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Padrão de acesso não permitido',
        timestamp: new Date().toISOString(),
        path: url,
        method: method,
      });
    }

    // Log de acesso normal para rotas sensíveis
    if (url.includes('/v1/auth') || url.includes('/v1/umx')) {
      this.logger.log(
        `🔍 Acesso a rota sensível: ${method} ${url} - IP: ${ip}`
      );
    }

    return true;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    
    // Remover headers sensíveis dos logs
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    delete sanitized['x-auth-token'];
    
    return sanitized;
  }
}