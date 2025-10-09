import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import type { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    try {
      // Extrair token do header Authorization ou cookies
      let token: string | undefined;
      
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (request.cookies?.accessToken) {
        token = request.cookies.accessToken;
      }

      if (!token) {
        this.logger.warn('Token de acesso não encontrado');
        throw new UnauthorizedException('Token de acesso requerido');
      }

      // Verificar e decodificar o token
      const payload = this.jwtService.verify(token);
      
      if (!payload.sub) {
        this.logger.warn('Token inválido - sub não encontrado');
        throw new UnauthorizedException('Token inválido');
      }

      // Buscar usuário no banco de dados
      const user = await this.userRepository.findOne({
        where: { uuid: payload.sub },
        select: ['uuid', 'isTenantAdmin', 'isActive', 'isVerified'],
      });

      if (!user) {
        this.logger.warn(`Usuário não encontrado: ${payload.sub}`);
        throw new UnauthorizedException('Usuário não encontrado');
      }

      if (!user.isActive || !user.isVerified) {
        this.logger.warn(`Usuário inativo ou não verificado: ${payload.sub}`);
        throw new UnauthorizedException('Usuário inativo ou não verificado');
      }

      if (!user.isTenantAdmin) {
        this.logger.warn(`Acesso negado - usuário não é admin: ${payload.sub}`);
        throw new ForbiddenException('Acesso restrito a administradores');
      }

      // Adicionar informações do usuário à requisição
      request.user = {
        uuid: user.uuid,
        isTenantAdmin: user.isTenantAdmin,
      };

      this.logger.log(`Acesso admin autorizado para: ${user.uuid}`);
      return true;

    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error('Erro na verificação de admin:', error);
      throw new UnauthorizedException('Erro na verificação de autorização');
    }
  }
}