import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

interface SecurityEvent {
  type: 'SUSPICIOUS_ACTIVITY' | 'FAILED_AUTH' | 'RATE_LIMIT_HIT' | 'BLOCKED_ACCESS' | 'SQL_INJECTION_ATTEMPT' | 'XSS_ATTEMPT';
  ip: string;
  userAgent: string;
  method: string;
  url: string;
  timestamp: string;
  details?: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

@Injectable()
export class SecurityLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityLoggingInterceptor.name);
  
  // Padrões suspeitos para detecção
  private readonly suspiciousPatterns = {
    sqlInjection: [
      /(\bUNION\b.*\bSELECT\b)/i,
      /(\bSELECT\b.*\bFROM\b.*\bWHERE\b)/i,
      /(\bINSERT\b.*\bINTO\b)/i,
      /(\bDELETE\b.*\bFROM\b)/i,
      /(\bDROP\b.*\bTABLE\b)/i,
      /(\bUPDATE\b.*\bSET\b)/i,
      /(\'.*OR.*\'.*=.*\')/i,
      /(\".*OR.*\".*=.*\")/i,
      /(\-\-)/,
      /(\#)/,
      /(\bEXEC\b)/i,
      /(\bEXECUTE\b)/i,
    ],
    xss: [
      /<script[^>]*>.*?<\/script>/i,
      /<iframe[^>]*>.*?<\/iframe>/i,
      /<object[^>]*>.*?<\/object>/i,
      /<embed[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<img[^>]*onerror[^>]*>/i,
      /<svg[^>]*onload[^>]*>/i,
    ],
    pathTraversal: [
      /\.\.\//,
      /\.\.\\/,
      /\/etc\/passwd/i,
      /\/proc\/self\/environ/i,
      /\/windows\/system32/i,
    ],
    bruteForce: [
      /admin/i,
      /administrator/i,
      /root/i,
      /password/i,
      /login/i,
    ],
  };

  // User agents suspeitos
  private readonly suspiciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /burp/i,
    /owasp/i,
    /zap/i,
    /w3af/i,
    /acunetix/i,
    /nessus/i,
    /openvas/i,
    /masscan/i,
    /gobuster/i,
    /dirb/i,
    /dirbuster/i,
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const startTime = Date.now();
    const { method, url, headers, body, query } = request;
    const ip = request.ip || request.connection.remoteAddress || 'Unknown';
    const userAgent = headers['user-agent'] || 'Unknown';

    // Verificar atividade suspeita antes da execução
    this.checkSuspiciousActivity(request);

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        
        // Log de acesso normal para rotas sensíveis
        if (this.isSensitiveRoute(url)) {
          this.logger.log(
            `🔍 Acesso a rota sensível: ${method} ${url} - IP: ${ip} - Duração: ${duration}ms - Status: ${response.statusCode}`
          );
        }

        // Detectar possíveis tentativas de enumeração
        if (duration < 50 && method === 'GET') {
          this.logSecurityEvent({
            type: 'SUSPICIOUS_ACTIVITY',
            ip,
            userAgent,
            method,
            url,
            timestamp: new Date().toISOString(),
            severity: 'LOW',
            details: {
              reason: 'Resposta muito rápida - possível enumeração',
              duration,
              statusCode: response.statusCode,
            },
          });
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        // Log de erros com contexto de segurança
        if (error.status === 401 || error.status === 403) {
          this.logSecurityEvent({
            type: 'FAILED_AUTH',
            ip,
            userAgent,
            method,
            url,
            timestamp: new Date().toISOString(),
            severity: 'MEDIUM',
            details: {
              error: error.message,
              statusCode: error.status,
              duration,
              body: this.sanitizeBody(body),
            },
          });
        } else if (error.status === 429) {
          this.logSecurityEvent({
            type: 'RATE_LIMIT_HIT',
            ip,
            userAgent,
            method,
            url,
            timestamp: new Date().toISOString(),
            severity: 'HIGH',
            details: {
              error: error.message,
              duration,
            },
          });
        }
        
        throw error;
      })
    );
  }

  private checkSuspiciousActivity(request: Request): void {
    const { method, url, headers, body, query } = request;
    const ip = request.ip || request.connection.remoteAddress || 'Unknown';
    const userAgent = headers['user-agent'] || 'Unknown';
    
    // Verificar User Agent suspeito
    if (this.suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
      this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip,
        userAgent,
        method,
        url,
        timestamp: new Date().toISOString(),
        severity: 'MEDIUM',
        details: { reason: 'User Agent suspeito detectado' },
      });
    }

    // Verificar SQL Injection
    const allInputs = JSON.stringify({ ...body, ...query, url });
    if (this.suspiciousPatterns.sqlInjection.some(pattern => pattern.test(allInputs))) {
      this.logSecurityEvent({
        type: 'SQL_INJECTION_ATTEMPT',
        ip,
        userAgent,
        method,
        url,
        timestamp: new Date().toISOString(),
        severity: 'CRITICAL',
        details: {
          reason: 'Tentativa de SQL Injection detectada',
          inputs: this.sanitizeBody({ ...body, ...query }),
        },
      });
    }

    // Verificar XSS
    if (this.suspiciousPatterns.xss.some(pattern => pattern.test(allInputs))) {
      this.logSecurityEvent({
        type: 'XSS_ATTEMPT',
        ip,
        userAgent,
        method,
        url,
        timestamp: new Date().toISOString(),
        severity: 'HIGH',
        details: {
          reason: 'Tentativa de XSS detectada',
          inputs: this.sanitizeBody({ ...body, ...query }),
        },
      });
    }

    // Verificar Path Traversal
    if (this.suspiciousPatterns.pathTraversal.some(pattern => pattern.test(url))) {
      this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip,
        userAgent,
        method,
        url,
        timestamp: new Date().toISOString(),
        severity: 'HIGH',
        details: {
          reason: 'Tentativa de Path Traversal detectada',
          url,
        },
      });
    }

    // Verificar múltiplas requisições para rotas de autenticação
    if (url.includes('/auth/') && method === 'POST') {
      this.checkBruteForcePattern(ip, userAgent, url);
    }
  }

  private checkBruteForcePattern(ip: string, userAgent: string, url: string): void {
    // Esta lógica seria expandida com um cache/redis para rastrear padrões
    // Por agora, apenas logamos tentativas de autenticação
    this.logger.warn(
      `🔍 Tentativa de autenticação: IP ${ip} - ${url} - UserAgent: ${userAgent}`
    );
  }

  private isSensitiveRoute(url: string): boolean {
    const sensitiveRoutes = [
      '/auth/',
      '/umx',
      '/admin',
      '/config',
      '/debug',
    ];
    
    return sensitiveRoutes.some(route => url.includes(route));
  }

  private logSecurityEvent(event: SecurityEvent): void {
    const logLevel = this.getLogLevel(event.severity);
    const message = `🚨 EVENTO DE SEGURANÇA [${event.severity}] - ${event.type}: ${event.method} ${event.url} - IP: ${event.ip}`;
    
    this.logger[logLevel](message, {
      ...event,
      userAgent: event.userAgent.substring(0, 200), // Limitar tamanho
    });

    // Em produção, aqui você enviaria para um sistema de monitoramento
    // como Sentry, DataDog, CloudWatch, etc.
    if (event.severity === 'CRITICAL') {
      this.logger.error('🚨 ALERTA CRÍTICO DE SEGURANÇA - Ação imediata necessária!', event);
    }
  }

  private getLogLevel(severity: string): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'LOW':
        return 'log';
      case 'MEDIUM':
        return 'warn';
      case 'HIGH':
      case 'CRITICAL':
        return 'error';
      default:
        return 'log';
    }
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    
    // Remover campos sensíveis dos logs
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}