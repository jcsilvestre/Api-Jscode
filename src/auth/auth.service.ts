import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserToken } from './entities/user-token.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { EmailService } from './services/email.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { ResendTokenDto } from './dto/resend-token.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserToken)
    private userTokenRepository: Repository<UserToken>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  private generateToken(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { name, email, password } = registerDto;

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

    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Gerar token de verificação
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutos

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

  async completeRegistration(completeRegistrationDto: CompleteRegistrationDto): Promise<{ message: string; success: boolean; accessToken?: string }> {
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

    // Gerar JWT token
    const payload = { 
      sub: savedUser.uuid, 
      email: savedUser.email, 
      tenantId: savedTenant.id,
      isTenantAdmin: true 
    };
    const accessToken = this.jwtService.sign(payload);

    return { 
      message: 'Cadastro completado com sucesso!', 
      success: true, 
      accessToken 
    };
  }

  async login(loginDto: LoginDto): Promise<{ message: string; success: boolean; accessToken?: string }> {
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

    // Gerar JWT token
    const payload = { 
      sub: user.uuid, 
      email: user.email, 
      tenantId: user.tenantId,
      isTenantAdmin: user.isTenantAdmin 
    };
    const accessToken = this.jwtService.sign(payload);

    return { 
      message: 'Login realizado com sucesso!', 
      success: true, 
      accessToken 
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
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutos

    // Atualizar token
    existingToken.token = newToken;
    existingToken.expires_at = expiresAt;
    await this.userTokenRepository.save(existingToken);

    // Enviar novo email
    await this.emailService.sendVerificationEmail(email, newToken);

    return { message: 'Novo código de verificação enviado para seu email.' };
  }
}
