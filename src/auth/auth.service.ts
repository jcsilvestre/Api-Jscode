import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserToken } from './entities/user-token.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { UserSession } from '../user-sessions/user-session.entity';
import { EmailService } from './services/email.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { ResendTokenDto } from './dto/resend-token.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12; // Aumentado de 10 para 12 para maior segurança
  private readonly TOKEN_EXPIRY_MINUTES = 15;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  
  constructor(
    @InjectRepository(UserToken)
    private userTokenRepository: Repository<UserToken>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
    private emailService: EmailService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private generateToken(): string {
    // Gerar token alfanumérico de 9 caracteres usando crypto para maior segurança
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    
    // Usar crypto.randomInt para melhor aleatoriedade
    for (let i = 0; i < 9; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      token += chars.charAt(randomIndex);
    }
    
    return token;
  }

  private generateRefreshToken(): string {
    // Gerar refresh token seguro de 32 bytes
    return crypto.randomBytes(32).toString('hex');
  }

  private async validatePassword(password: string): Promise<void> {
    if (!password || password.length < 8) {
      throw new BadRequestException('A senha deve ter pelo menos 8 caracteres.');
    }
    
    // Verificar se contém pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException('A senha deve conter pelo menos: 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.');
    }
  }

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { name, email, password } = registerDto;

    // Validar força da senha
    await this.validatePassword(password);

    // Verificar se já existe um usuário com este email
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Já existe um usuário cadastrado com este email.');
    }

    // Verificar se já existe um token pendente para este email
    const existingToken = await this.userTokenRepository.findOne({
      where: { email, is_verified: false },
    });

    if (existingToken) {
      // Se existe e ainda não expirou, retornar erro
      if (existingToken.expires_at > new Date()) {
        throw new BadRequestException('Já existe um código pendente para este email. Verifique sua caixa de entrada ou aguarde para solicitar um novo.');
      }
      
      // Se expirou, remover o token antigo
      await this.userTokenRepository.remove(existingToken);
    }

    // Hash da senha com salt rounds melhorado
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Gerar token de verificação
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.TOKEN_EXPIRY_MINUTES);

    // Salvar token no banco
    const userToken = this.userTokenRepository.create({
      name,
      email,
      password: hashedPassword,
      token,
      expires_at: expiresAt,
      is_verified: false,
    });

    await this.userTokenRepository.save(userToken);

    // Enviar email de verificação
    await this.emailService.sendVerificationEmail(email, token);

    return { message: 'Código de verificação enviado para seu email.' };
  }

  async verifyToken(verifyTokenDto: VerifyTokenDto): Promise<{ message: string; success: boolean; requiresCompletion?: boolean; userEmail?: string }> {
    const { email, token } = verifyTokenDto;

    const userToken = await this.userTokenRepository.findOne({
      where: { email, token, is_verified: false },
    });

    if (!userToken) {
      return { message: 'Código inválido.', success: false };
    }

    if (userToken.expires_at < new Date()) {
      return { message: 'Código expirado. Solicite um novo código.', success: false };
    }

    // Verificar se é o primeiro usuário (tenant master)
    const userCount = await this.userRepository.count();
    const isTenantMaster = userCount === 0;

    if (isTenantMaster) {
      // Para tenant master, apenas marcar token como verificado e retornar que precisa completar
      userToken.is_verified = true;
      await this.userTokenRepository.save(userToken);
      
      return { 
        message: 'Email verificado! Complete seu cadastro como administrador.', 
        success: true, 
        requiresCompletion: true,
        userEmail: email
      };
    } else {
      // Para usuários subsequentes, criar usuário normalmente
      const existingTenant = await this.tenantRepository.findOne({
        where: { is_active: true },
        order: { created_at: 'ASC' }
      });

      if (!existingTenant) {
        throw new BadRequestException('Nenhum tenant ativo encontrado.');
      }

      // Criar usuário
      const user = this.userRepository.create({
        fullName: userToken.name || userToken.email,
        email: userToken.email,
        passwordHash: userToken.password,
        tenantId: existingTenant.id,
        isVerified: true,
        isActive: true,
        isTenantAdmin: false,
      });

      await this.userRepository.save(user);

      // Marcar token como verificado
      userToken.is_verified = true;
      await this.userTokenRepository.save(userToken);

      return { message: 'Email verificado com sucesso!', success: true };
    }
  }

  async completeRegistration(completeRegistrationDto: CompleteRegistrationDto): Promise<{ message: string; success: boolean; accessToken?: string; refreshToken?: string }> {
    const { email, tenantName, tenantSlug, tenantDescription, maxUsers } = completeRegistrationDto;

    // Verificar se o token foi verificado
    const userToken = await this.userTokenRepository.findOne({
      where: { email, is_verified: true },
    });

    if (!userToken) {
      throw new BadRequestException('Token não encontrado ou não verificado.');
    }

    // Verificar se já existe um tenant (não deveria existir para tenant master)
    const existingTenant = await this.tenantRepository.findOne({
      where: { is_active: true },
    });

    if (existingTenant) {
      throw new BadRequestException('Já existe um tenant ativo no sistema.');
    }

    // Criar tenant
    const tenant = this.tenantRepository.create({
      name: tenantName,
      slug: tenantSlug,
      description: tenantDescription,
      max_users: maxUsers,
      is_active: true,
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Criar usuário tenant master
    const user = this.userRepository.create({
      fullName: userToken.name || userToken.email,
      email: userToken.email,
      passwordHash: userToken.password,
      tenantId: savedTenant.id,
      isVerified: true,
      isActive: true,
      isTenantAdmin: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Atualizar tenant com owner_user_id
    savedTenant.owner_user_id = savedUser.uuid;
    await this.tenantRepository.save(savedTenant);

    // Gerar JWT tokens
    const payload = { 
      sub: savedUser.uuid, 
      email: savedUser.email, 
      tenantId: savedTenant.id,
      isTenantAdmin: true,
      type: 'access'
    };

    const refreshPayload = {
      sub: savedUser.uuid,
      type: 'refresh'
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '7d',
    });

    return { 
      message: 'Cadastro completado com sucesso!', 
      success: true, 
      accessToken,
      refreshToken
    };
  }



  async resendToken(resendTokenDto: ResendTokenDto): Promise<{ message: string }> {
    const { email } = resendTokenDto;

    // Buscar token existente não verificado
    const existingToken = await this.userTokenRepository.findOne({
      where: { email, is_verified: false },
    });

    if (!existingToken) {
      throw new NotFoundException('Nenhum token pendente encontrado para este email.');
    }

    // Gerar novo token
    const newToken = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.TOKEN_EXPIRY_MINUTES);

    // Atualizar token
    existingToken.token = newToken;
    existingToken.expires_at = expiresAt;
    await this.userTokenRepository.save(existingToken);

    // Enviar novo email
    await this.emailService.sendVerificationEmail(email, newToken);

    return { message: 'Novo código de verificação enviado para seu email.' };
  }

  async refreshToken(refreshToken: string, sessionId?: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verificar refresh token
      const payload = this.jwtService.verify(refreshToken);
      
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token inválido.');
      }

      // Buscar usuário
      const user = await this.userRepository.findOne({
        where: { uuid: payload.sub, isActive: true },
        relations: ['tenant'],
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado.');
      }

      // Se sessionId foi fornecido, verificar se a sessão ainda está ativa
      if (sessionId) {
        const session = await this.userSessionRepository.findOne({
          where: { id: sessionId, user_id: user.uuid, is_active: true }
        });

        if (!session) {
          throw new UnauthorizedException('Sessão inválida ou expirada.');
        }
      }

      // Gerar novos tokens com rotação
      const jti = crypto.randomUUID(); // Unique token identifier
      const newPayload = { 
        sub: user.uuid, 
        email: user.email, 
        tenantId: user.tenantId,
        isTenantAdmin: user.isTenantAdmin,
        type: 'access',
        jti: jti,
        sessionId: sessionId
      };

      const newRefreshPayload = {
        sub: user.uuid,
        type: 'refresh',
        jti: jti,
        sessionId: sessionId
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      });

      const newRefreshToken = this.jwtService.sign(newRefreshPayload, {
        expiresIn: '7d',
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedException('Token de refresh inválido ou expirado.');
    }
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{ 
    message: string; 
    success: boolean; 
    accessToken?: string; 
    refreshToken?: string;
    sessionId?: string;
  }> {
    const { email, password } = loginDto;

    // Buscar usuário
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
      relations: ['tenant'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Verificar se usuário está verificado
    if (!user.isVerified) {
      throw new UnauthorizedException('Email não verificado.');
    }

    // Criar nova sessão de usuário
    const session = await this.userSessionRepository.save({
      user_id: user.uuid,
      ip_address: ipAddress,
      user_agent: userAgent,
      login_at: new Date(),
      is_active: true
    });

    // Atualizar último login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Gerar JWT tokens com session ID
    const jti = crypto.randomUUID();
    const payload = { 
      sub: user.uuid, 
      email: user.email, 
      tenantId: user.tenantId,
      isTenantAdmin: user.isTenantAdmin,
      type: 'access',
      jti: jti,
      sessionId: session.id
    };

    const refreshPayload = {
      sub: user.uuid,
      type: 'refresh',
      jti: jti,
      sessionId: session.id
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '7d', // Refresh token válido por 7 dias
    });

    return { 
      message: 'Login realizado com sucesso!', 
      success: true, 
      accessToken,
      refreshToken,
      sessionId: session.id
    };
  }

  async logout(sessionId?: string, userId?: string): Promise<{ message: string; success: boolean }> {
    if (sessionId) {
      // Invalidar sessão específica
      await this.userSessionRepository.update(
        { id: sessionId },
        { is_active: false, logout_at: new Date() }
      );
    } else if (userId) {
      // Invalidar todas as sessões do usuário
      await this.userSessionRepository.update(
        { user_id: userId, is_active: true },
        { is_active: false, logout_at: new Date() }
      );
    }

    return {
      message: 'Logout realizado com sucesso!',
      success: true
    };
  }

  async revokeAllUserSessions(userId: string): Promise<{ message: string; success: boolean }> {
    await this.userSessionRepository.update(
      { user_id: userId },
      { is_active: false, logout_at: new Date() }
    );

    return {
      message: 'Todas as sessões do usuário foram revogadas com sucesso!',
      success: true
    };
  }

  async getActiveSessions(userId: string): Promise<UserSession[]> {
    return this.userSessionRepository.find({
      where: { user_id: userId, is_active: true },
      order: { login_at: 'DESC' },
    });
  }

  // Métodos administrativos
  async getAllActiveSessionsForAdmin(options: {
    page: number;
    limit: number;
    userId?: string;
  }): Promise<{
    sessions: UserSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, userId } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userSessionRepository
      .createQueryBuilder('session')
      .where('session.is_active = :isActive', { isActive: true })
      .orderBy('session.login_at', 'DESC');

    if (userId) {
      queryBuilder.andWhere('session.user_id = :userId', { userId });
    }

    const [sessions, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSuspiciousSessionsForAdmin(options: {
    hours: number;
    page: number;
    limit: number;
  }): Promise<{
    sessions: UserSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { hours, page, limit } = options;
    const skip = (page - 1) * limit;
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Sessões suspeitas: múltiplas sessões do mesmo usuário em IPs diferentes nas últimas X horas
    const queryBuilder = this.userSessionRepository
      .createQueryBuilder('session')
      .select([
        'session.id',
        'session.user_id',
        'session.ip_address',
        'session.user_agent',
        'session.login_at',
        'session.is_active'
      ])
      .where('session.login_at >= :cutoffDate', { cutoffDate })
      .andWhere('session.is_active = :isActive', { isActive: true })
      .andWhere(`
        session.user_id IN (
          SELECT s2.user_id 
          FROM users_sessions s2 
          WHERE s2.login_at >= :cutoffDate 
          AND s2.is_active = true
          GROUP BY s2.user_id 
          HAVING COUNT(DISTINCT s2.ip_address) > 1
        )
      `)
      .orderBy('session.login_at', 'DESC');

    const [sessions, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSessionStatsForAdmin(): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    averageSessionsPerUser: number;
    sessionsLast24h: number;
    sessionsLast7d: number;
    topUserAgents: Array<{ user_agent: string; count: number }>;
    topIpAddresses: Array<{ ip_address: string; count: number }>;
  }> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total de sessões ativas
    const totalActiveSessions = await this.userSessionRepository.count({
      where: { is_active: true },
    });

    // Total de usuários únicos com sessões ativas
    const totalUsersResult = await this.userSessionRepository
      .createQueryBuilder('session')
      .select('COUNT(DISTINCT session.user_id)', 'count')
      .where('session.is_active = :isActive', { isActive: true })
      .getRawOne();
    const totalUsers = parseInt(totalUsersResult.count) || 0;

    // Sessões nas últimas 24h
    const sessionsLast24h = await this.userSessionRepository.count({
      where: {
        login_at: MoreThanOrEqual(last24h),
        is_active: true,
      },
    });

    // Sessões nos últimos 7 dias
    const sessionsLast7d = await this.userSessionRepository.count({
      where: {
        login_at: MoreThanOrEqual(last7d),
        is_active: true,
      },
    });

    // Top User Agents
    const topUserAgents = await this.userSessionRepository
      .createQueryBuilder('session')
      .select('session.user_agent', 'user_agent')
      .addSelect('COUNT(*)', 'count')
      .where('session.is_active = :isActive', { isActive: true })
      .andWhere('session.user_agent IS NOT NULL')
      .groupBy('session.user_agent')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Top IP Addresses
    const topIpAddresses = await this.userSessionRepository
      .createQueryBuilder('session')
      .select('session.ip_address', 'ip_address')
      .addSelect('COUNT(*)', 'count')
      .where('session.is_active = :isActive', { isActive: true })
      .andWhere('session.ip_address IS NOT NULL')
      .groupBy('session.ip_address')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalActiveSessions,
      totalUsers,
      averageSessionsPerUser: totalUsers > 0 ? totalActiveSessions / totalUsers : 0,
      sessionsLast24h,
      sessionsLast7d,
      topUserAgents: topUserAgents.map(ua => ({
        user_agent: ua.user_agent,
        count: parseInt(ua.count),
      })),
      topIpAddresses: topIpAddresses.map(ip => ({
        ip_address: ip.ip_address,
        count: parseInt(ip.count),
      })),
    };
  }
}
