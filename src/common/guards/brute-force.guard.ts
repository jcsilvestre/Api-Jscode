import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

interface AttemptRecord {
  count: number;
  firstAttempt: Date;
  lastAttempt: Date;
  blocked: boolean;
  blockExpiry?: Date;
}

@Injectable()
export class BruteForceGuard implements CanActivate {
  private readonly logger = new Logger(BruteForceGuard.name);
  
  // Armazenamento em memória - em produção use Redis
  private readonly attempts = new Map<string, AttemptRecord>();
  
  // Configurações
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MINUTES = 15; // Janela de tempo para contar tentativas
  private readonly BLOCK_DURATION_MINUTES = 30; // Tempo de bloqueio
  private readonly PROGRESSIVE_DELAY_MS = 1000; // Delay progressivo base
  
  // IPs que nunca devem ser bloqueados
  private readonly WHITELIST_IPS = [
    '127.0.0.1',
    '::1',
    'localhost',
    '192.168.1.11', // IP específico do usuário - ajustar manualmente se necessário
    // Adicione outros IPs da rede local conforme necessário:
    // '192.168.1.0/24', // Toda a rede local (implementar lógica de subnet se necessário)
  ];

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const route = request.route?.path || request.url;
    
    // Verificar se o IP está na whitelist
    if (this.isWhitelisted(ip)) {
      return true;
    }

    const key = `${ip}:${route}`;
    const now = new Date();
    
    // Limpar registros expirados
    this.cleanExpiredRecords();
    
    let record = this.attempts.get(key);
    
    if (!record) {
      // Primeira tentativa
      record = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false,
      };
    }

    // Verificar se ainda está bloqueado
    if (record.blocked && record.blockExpiry && now < record.blockExpiry) {
      const remainingTime = Math.ceil((record.blockExpiry.getTime() - now.getTime()) / 1000 / 60);
      
      this.logger.warn(
        `🚫 IP bloqueado por brute force: ${ip} - Rota: ${route} - Restam ${remainingTime} minutos`
      );
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `IP temporariamente bloqueado. Tente novamente em ${remainingTime} minutos.`,
          error: 'Too Many Requests',
          retryAfter: remainingTime * 60,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Verificar se a janela de tempo expirou
    const windowExpiry = new Date(record.firstAttempt.getTime() + this.WINDOW_MINUTES * 60 * 1000);
    if (now > windowExpiry) {
      // Reset do contador
      record = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false,
      };
    }

    // Incrementar contador de tentativas
    record.count++;
    record.lastAttempt = now;

    // Aplicar delay progressivo
    if (record.count > 2) {
      const delay = this.calculateProgressiveDelay(record.count);
      await this.sleep(delay);
      
      this.logger.warn(
        `⏱️ Delay progressivo aplicado: ${delay}ms para IP ${ip} - Tentativa ${record.count}`
      );
    }

    // Verificar se excedeu o limite
    if (record.count >= this.MAX_ATTEMPTS) {
      record.blocked = true;
      record.blockExpiry = new Date(now.getTime() + this.BLOCK_DURATION_MINUTES * 60 * 1000);
      
      this.logger.error(
        `🚨 IP bloqueado por brute force: ${ip} - Rota: ${route} - ${record.count} tentativas em ${this.WINDOW_MINUTES} minutos`
      );
      
      // Log detalhado para análise
      this.logBruteForceAttempt(ip, userAgent, route, record);
      
      this.attempts.set(key, record);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Muitas tentativas falharam. IP bloqueado por ${this.BLOCK_DURATION_MINUTES} minutos.`,
          error: 'Brute Force Protection',
          retryAfter: this.BLOCK_DURATION_MINUTES * 60,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Salvar registro atualizado
    this.attempts.set(key, record);
    
    // Log de tentativa suspeita
    if (record.count > 2) {
      this.logger.warn(
        `⚠️ Múltiplas tentativas detectadas: IP ${ip} - Rota: ${route} - Tentativa ${record.count}/${this.MAX_ATTEMPTS}`
      );
    }

    return true;
  }

  private getClientIp(request: Request): string {
    // Verificar vários headers para obter o IP real
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

  private isWhitelisted(ip: string): boolean {
    // Verificação simples de IP
    if (this.WHITELIST_IPS.includes(ip)) {
      return true;
    }
    
    // Verificar se é localhost em diferentes formatos
    if (ip === '::ffff:127.0.0.1' || ip.includes('127.0.0.1') || ip.includes('::1')) {
      return true;
    }
    
    // Verificar se é IP local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const localIpPatterns = [
      /^192\.168\.\d{1,3}\.\d{1,3}$/,
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
    ];
    
    return localIpPatterns.some(pattern => pattern.test(ip));
  }

  private calculateProgressiveDelay(attemptCount: number): number {
    // Delay exponencial: 1s, 2s, 4s, 8s, 16s...
    const delay = this.PROGRESSIVE_DELAY_MS * Math.pow(2, attemptCount - 3);
    
    // Máximo de 30 segundos
    return Math.min(delay, 30000);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private cleanExpiredRecords(): void {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    for (const [key, record] of this.attempts.entries()) {
      // Remover registros muito antigos (mais de 24 horas)
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      if (now.getTime() - record.firstAttempt.getTime() > maxAge) {
        expiredKeys.push(key);
        continue;
      }
      
      // Remover bloqueios expirados
      if (record.blocked && record.blockExpiry && now > record.blockExpiry) {
        record.blocked = false;
        record.blockExpiry = undefined;
        record.count = 0; // Reset contador após desbloqueio
      }
    }
    
    // Remover registros expirados
    expiredKeys.forEach(key => this.attempts.delete(key));
    
    if (expiredKeys.length > 0) {
      this.logger.log(`🧹 Limpeza: ${expiredKeys.length} registros expirados removidos`);
    }
  }

  private logBruteForceAttempt(
    ip: string,
    userAgent: string,
    route: string,
    record: AttemptRecord,
  ): void {
    const duration = record.lastAttempt.getTime() - record.firstAttempt.getTime();
    
    this.logger.error('🚨 BRUTE FORCE DETECTADO', {
      ip,
      userAgent: userAgent.substring(0, 200),
      route,
      attempts: record.count,
      duration: `${Math.round(duration / 1000)}s`,
      firstAttempt: record.firstAttempt.toISOString(),
      lastAttempt: record.lastAttempt.toISOString(),
      blocked: true,
      blockExpiry: record.blockExpiry?.toISOString(),
    });
  }

  // Método para administradores desbloquearem IPs manualmente
  public unblockIp(ip: string, route?: string): boolean {
    if (route) {
      const key = `${ip}:${route}`;
      const record = this.attempts.get(key);
      if (record) {
        record.blocked = false;
        record.blockExpiry = undefined;
        record.count = 0;
        this.attempts.set(key, record);
        this.logger.log(`🔓 IP desbloqueado manualmente: ${ip} - Rota: ${route}`);
        return true;
      }
    } else {
      // Desbloquear todas as rotas para o IP
      let unblocked = false;
      for (const [key, record] of this.attempts.entries()) {
        if (key.startsWith(`${ip}:`)) {
          record.blocked = false;
          record.blockExpiry = undefined;
          record.count = 0;
          this.attempts.set(key, record);
          unblocked = true;
        }
      }
      if (unblocked) {
        this.logger.log(`🔓 IP desbloqueado manualmente (todas as rotas): ${ip}`);
      }
      return unblocked;
    }
    return false;
  }

  // Método para obter estatísticas
  public getStats(): any {
    const stats = {
      totalRecords: this.attempts.size,
      blockedIps: 0,
      activeAttempts: 0,
    };
    
    for (const record of this.attempts.values()) {
      if (record.blocked) {
        stats.blockedIps++;
      }
      if (record.count > 0) {
        stats.activeAttempts++;
      }
    }
    
    return stats;
  }
}