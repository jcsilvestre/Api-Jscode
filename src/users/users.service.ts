import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    this.logger.log('🔧 UsersService inicializado com repositório PostgreSQL');
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`🔵 SERVICE: Iniciando criação de usuário com email: ${createUserDto.email}`);
    this.logger.log(`🔍 Verificando se email já existe no banco...`);
    
    try {
      // Verificar se o email já existe
      const existingUser = await this.usersRepository.findOne({
        where: { email: createUserDto.email }
      });

      if (existingUser) {
        this.logger.warn(`⚠️  Email já existe no banco - ID: ${existingUser.id}, Email: ${createUserDto.email}`);
        throw new ConflictException('Email já está em uso');
      }

      this.logger.log(`✅ Email disponível, criando usuário no banco...`);
      const user = this.usersRepository.create(createUserDto);
      const savedUser = await this.usersRepository.save(user);
      
      this.logger.log(`✅ SERVICE: Usuário salvo no PostgreSQL - ID: ${savedUser.id}, Email: ${savedUser.email}`);
      this.logger.log(`📊 Dados salvos: ${JSON.stringify(savedUser, null, 2)}`);
      return savedUser;
    } catch (error) {
      this.logger.error(`❌ SERVICE: Erro ao criar usuário no banco: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    this.logger.log('🔵 SERVICE: Iniciando consulta de todos os usuários no PostgreSQL');
    this.logger.log('🔍 Executando SELECT * FROM users...');
    
    try {
      const users = await this.usersRepository.find({
        order: { id: 'ASC' }
      });
      
      this.logger.log(`✅ SERVICE: Consulta executada com sucesso`);
      this.logger.log(`📊 Registros encontrados na tabela 'users': ${users.length}`);
      
      if (users.length === 0) {
        this.logger.warn(`⚠️  ATENÇÃO: Tabela 'users' está vazia!`);
        this.logger.log(`💡 Para adicionar dados, use POST /users`);
      } else {
        this.logger.log(`📋 Dados retornados do banco:`);
        users.forEach((user, index) => {
          this.logger.log(`   ${index + 1}. [ID: ${user.id}] ${user.fullName} (${user.email}) - Ativo: ${user.isActive}`);
        });
      }
      
      return users;
    } catch (error) {
      this.logger.error(`❌ SERVICE: Erro ao consultar usuários no PostgreSQL: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: number): Promise<User> {
    this.logger.log(`🔵 SERVICE: Buscando usuário com ID: ${id} no PostgreSQL`);
    this.logger.log(`🔍 Executando SELECT * FROM users WHERE id = ${id}...`);
    
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      
      if (!user) {
        this.logger.warn(`⚠️  Usuário não encontrado no banco - ID: ${id}`);
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      }
      
      this.logger.log(`✅ SERVICE: Usuário encontrado no banco`);
      this.logger.log(`📊 Dados: [ID: ${user.id}] ${user.fullName} (${user.email})`);
      return user;
    } catch (error) {
      this.logger.error(`❌ SERVICE: Erro ao buscar usuário ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByUuid(uuid: string): Promise<User> {
    this.logger.log(`🔵 SERVICE: Buscando usuário com UUID: ${uuid} no PostgreSQL`);
    this.logger.log(`🔍 Executando SELECT * FROM users WHERE uuid = '${uuid}'...`);
    
    try {
      const user = await this.usersRepository.findOne({ where: { uuid } });
      
      if (!user) {
        this.logger.warn(`⚠️  Usuário não encontrado no banco - UUID: ${uuid}`);
        throw new NotFoundException(`Usuário com UUID ${uuid} não encontrado`);
      }
      
      this.logger.log(`✅ SERVICE: Usuário encontrado no banco`);
      this.logger.log(`📊 Dados: [ID: ${user.id}] ${user.fullName} (${user.email})`);
      return user;
    } catch (error) {
      this.logger.error(`❌ SERVICE: Erro ao buscar usuário UUID ${uuid}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`🔵 SERVICE: Iniciando atualização do usuário ID: ${id}`);
    this.logger.log(`📝 Dados para atualização: ${JSON.stringify(updateUserDto, null, 2)}`);
    
    try {
      const user = await this.findOne(id);
      
      // Se está tentando atualizar o email, verificar se não existe outro usuário com esse email
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        this.logger.log(`🔍 Verificando se novo email está disponível: ${updateUserDto.email}`);
        const existingUser = await this.usersRepository.findOne({
          where: { email: updateUserDto.email }
        });
        
        if (existingUser) {
          this.logger.warn(`⚠️  Email já em uso por outro usuário - ID: ${existingUser.id}`);
          throw new ConflictException('Email já está em uso');
        }
      }

      this.logger.log(`✅ Atualizando dados no PostgreSQL...`);
      Object.assign(user, updateUserDto);
      const updatedUser = await this.usersRepository.save(user);
      
      this.logger.log(`✅ SERVICE: Usuário atualizado no banco - ID: ${updatedUser.id}`);
      this.logger.log(`📊 Dados atualizados: ${JSON.stringify(updatedUser, null, 2)}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`❌ SERVICE: Erro ao atualizar usuário ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`🔵 SERVICE: Iniciando remoção do usuário ID: ${id}`);
    
    try {
      const user = await this.findOne(id);
      this.logger.log(`🗑️  Removendo usuário do PostgreSQL: ${user.fullName} (${user.email})`);
      
      await this.usersRepository.remove(user);
      
      this.logger.log(`✅ SERVICE: Usuário removido do banco - ID: ${id}`);
    } catch (error) {
      this.logger.error(`❌ SERVICE: Erro ao remover usuário ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}