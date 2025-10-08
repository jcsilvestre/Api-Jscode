import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from './user-session.entity';
import { CreateUserSessionDto } from './dto/create-user-session.dto';
import { UpdateUserSessionDto } from './dto/update-user-session.dto';

@Injectable()
export class UserSessionsService {
  constructor(
    @InjectRepository(UserSession)
    private userSessionsRepository: Repository<UserSession>,
  ) {}

  async create(createUserSessionDto: CreateUserSessionDto): Promise<UserSession> {
    // Map DTO fields to entity fields
    const sessionData = {
      user_id: createUserSessionDto.userId,
      ip_address: createUserSessionDto.ipAddress,
      user_agent: createUserSessionDto.userAgent,
      login_at: createUserSessionDto.loginAt ? new Date(createUserSessionDto.loginAt) : new Date(),
      logout_at: createUserSessionDto.logoutAt ? new Date(createUserSessionDto.logoutAt) : undefined,
      is_active: createUserSessionDto.isActive ?? true
    };

    return await this.userSessionsRepository.save(sessionData);
  }

  async findAll(): Promise<UserSession[]> {
    return await this.userSessionsRepository.find();
  }

  async findByUser(userId: string): Promise<UserSession[]> {
    return await this.userSessionsRepository.find({
      where: { user_id: userId },
      order: { login_at: 'DESC' }
    });
  }

  async findActiveByUser(userId: string): Promise<UserSession[]> {
    return await this.userSessionsRepository.find({
      where: { 
        user_id: userId,
        is_active: true
      },
      order: { login_at: 'DESC' }
    });
  }

  async findOne(id: string): Promise<UserSession> {
    const session = await this.userSessionsRepository.findOne({
      where: { id }
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  async update(id: string, updateUserSessionDto: UpdateUserSessionDto): Promise<UserSession> {
    const session = await this.findOne(id);

    Object.assign(session, updateUserSessionDto);
    
    if (updateUserSessionDto.loginAt) {
      session.login_at = new Date(updateUserSessionDto.loginAt);
    }
    
    if (updateUserSessionDto.logoutAt) {
      session.logout_at = new Date(updateUserSessionDto.logoutAt);
    }

    return await this.userSessionsRepository.save(session);
  }

  async remove(id: string): Promise<void> {
    const session = await this.findOne(id);
    await this.userSessionsRepository.remove(session);
  }

  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserSession> {
    const createDto: CreateUserSessionDto = {
      userId: userId,
      ipAddress: ipAddress,
      userAgent: userAgent,
      loginAt: new Date().toISOString()
    };

    return await this.create(createDto);
  }

  async deactivateSession(id: string): Promise<UserSession> {
    const session = await this.findOne(id);
    session.is_active = false;
    session.logout_at = new Date();
    return await this.userSessionsRepository.save(session);
  }

  async deactivateAllUserSessions(userId: string): Promise<void> {
    await this.userSessionsRepository.update(
      { user_id: userId },
      { is_active: false, logout_at: new Date() }
    );
  }
}