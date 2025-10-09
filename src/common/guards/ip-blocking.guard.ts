import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

interface FailedAttempt {
  count: number;
  firstAttempt: Date;
  lastAttempt: Date;
  blocked: boolean;
  blockedUntil?: Date;
}

@Injectable()
export class IpBlockingGuard implements CanActivate {
  private readonly logger = new Logger(IpBlockingGuard.name);
  
  // Armazenamento em memória das tentativas falhadas por IP
  private failedAttempts = new Map<string, FailedAttempt>();
  
  // Configurações de bloqueio
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly BLOCK_DURATION_MINUTES = 15;
  private readonly RESET_WINDOW_MINUTES = 60;
  
  // WHITELIST DE IPs - AJUSTE CONFORME NECESSÁRIO
  // TODO: Ajustar estes IPs quando chegar em casa
  // Adicione seu IP doméstico e da rede 192.168.1.11 aqui
  private readonly whitelistedIPs = [
    '127.0.0.1',
    '::1',
    'localhost',
    // TODO: Descomente e ajuste quando necessário
    // '192.168.1.11',  // Sua outra rede
    // '192.168.1.100', // Exemplo: seu IP doméstico
    // '192.168.0.100', // Exemplo: outro IP da rede local
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const clientIP = this.getClientIP(request);
    
    // Verificar se o IP está na whitelist
    if (this.isWhitelisted(clientIP)) {
      return true;
    }
    
    // Verificar se o IP está bloqueado
    if (this.isBlocked(clientIP)) {
      this.logger.warn(
        `🚫 IP bloqueado tentando acessar: ${clientIP} - ${request.method} ${request.url}`
      );
      
      const attempt = this.failedAttempts.get(clientIP);
      const blockedUntil = attempt?.blockedUntil || new Date();
      
      throw new ForbiddenException({
        statusCode: 403,
        message: 'IP temporariamente bloqueado devido a múltiplas tentativas falhadas',
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        blockedUntil: blockedUntil.toISOString(),
        retryAfter: Math.ceil((blockedUntil.getTime() - Date.now()) / 1000 / 60), // minutos
      });
    }
    
    return true;
  }

  // Método para registrar tentativa falhada
  recordFailedAttempt(ip: string, reason: string = 'Authentication failed'): void {
    if (this.isWhitelisted(ip)) {
      return; // Não registrar falhas para IPs whitelistados
    }

    const now = new Date();
    const existing = this.failedAttempts.get(ip);
    
    if (existing) {
      // Verificar se deve resetar o contador (janela de tempo expirou)
      const timeSinceFirst = now.getTime() - existing.firstAttempt.getTime();
      const resetWindowMs = this.RESET_WINDOW_MINUTES * 60 * 1000;
      
      if (timeSinceFirst > resetWindowMs) {
        // Resetar contador
        this.failedAttempts.set(ip, {
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
          blocked: false,
        });
      } else {
        // Incrementar contador
        existing.count++;
        existing.lastAttempt = now;
        
        // Verificar se deve bloquear
        if (existing.count >= this.MAX_FAILED_ATTEMPTS) {
          existing.blocked = true;
          existing.blockedUntil = new Date(now.getTime() + (this.BLOCK_DURATION_MINUTES * 60 * 1000));
          
          this.logger.error(
            `🚨 IP bloqueado por ${this.BLOCK_DURATION_MINUTES} minutos: ${ip} - ${existing.count} tentativas falhadas - Motivo: ${reason}`
          );
        } else {
          this.logger.warn(
            `⚠️ Tentativa falhada registrada para IP ${ip}: ${existing.count}/${this.MAX_FAILED_ATTEMPTS} - Motivo: ${reason}`
          );
        }
      }
    } else {
      // Primeira tentativa falhada
      this.failedAttempts.set(ip, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false,
      });
      
      this.logger.warn(
        `⚠️ Primeira tentativa falhada registrada para IP ${ip} - Motivo: ${reason}`
      );
    }
  }

  // Método para limpar tentativas bem-sucedidas
  clearFailedAttempts(ip: string): void {
    if (this.failedAttempts.has(ip)) {
      this.failedAttempts.delete(ip);
      this.logger.log(`✅ Tentativas falhadas limpas para IP: ${ip}`);
    }
  }

  private getClientIP(request: Request): string {
    // Tentar obter o IP real considerando proxies
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIP = request.headers['x-real-ip'] as string;
    const remoteAddress = request.connection?.remoteAddress || request.socket?.remoteAddress;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return remoteAddress || 'unknown';
  }

  private isWhitelisted(ip: string): boolean {
    return this.whitelistedIPs.includes(ip) || 
           this.whitelistedIPs.some(whiteIP => ip.startsWith(whiteIP));
  }

  private isBlocked(ip: string): boolean {
    const attempt = this.failedAttempts.get(ip);
    
    if (!attempt || !attempt.blocked) {
      return false;
    }
    
    // Verificar se o bloqueio expirou
    if (attempt.blockedUntil && new Date() > attempt.blockedUntil) {
      // Remover o bloqueio
      this.failedAttempts.delete(ip);
      this.logger.log(`🔓 Bloqueio expirado para IP: ${ip}`);
      return false;
    }
    
    return true;
  }

  // Método para obter estatísticas (útil para monitoramento)
  getBlockingStats(): any {
    const stats = {
      totalTrackedIPs: this.failedAttempts.size,
      blockedIPs: 0,
      whitelistedIPs: this.whitelistedIPs.length,
      details: [] as any[],
    };
    
    this.failedAttempts.forEach((attempt, ip) => {
      if (attempt.blocked) {
        stats.blockedIPs++;
      }
      
      stats.details.push({
        ip,
        failedAttempts: attempt.count,
        blocked: attempt.blocked,
        blockedUntil: attempt.blockedUntil?.toISOString(),
        firstAttempt: attempt.firstAttempt.toISOString(),
        lastAttempt: attempt.lastAttempt.toISOString(),
      });
    });
    
    return stats;
  }
}