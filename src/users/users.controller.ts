import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  ValidationPipe,
  UsePipes,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('umx')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`🔵 POST /v1/umx - Recebendo requisição para criar usuário`);
    this.logger.log(`📝 Dados recebidos: ${JSON.stringify(createUserDto, null, 2)}`);
    
    try {
      const user = await this.usersService.create(createUserDto);
      this.logger.log(`✅ POST /v1/umx - Usuário criado com sucesso - ID: ${user.id}`);
      this.logger.log(`📤 Retornando usuário: ${JSON.stringify(user, null, 2)}`);
      return user;
    } catch (error) {
      this.logger.error(`❌ POST /v1/umx - Erro: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    this.logger.log(`🔵 GET /v1/umx - Recebendo requisição para listar todos os usuários`);
    this.logger.log(`🔍 Consultando banco de dados PostgreSQL...`);
    
    try {
      const users = await this.usersService.findAll();
      this.logger.log(`✅ GET /v1/umx - Consulta realizada com sucesso`);
      this.logger.log(`📊 Total de usuários encontrados no banco: ${users.length}`);
      
      if (users.length === 0) {
        this.logger.warn(`⚠️  Nenhum usuário encontrado na tabela 'users'`);
        this.logger.log(`💡 Dica: Use POST /v1/umx para criar o primeiro usuário`);
      } else {
        this.logger.log(`📋 Lista de usuários:`);
        users.forEach((user, index) => {
          this.logger.log(`   ${index + 1}. ID: ${user.id} | Email: ${user.email} | Nome: ${user.fullName}`);
        });
      }
      
      this.logger.log(`📤 Retornando ${users.length} usuários`);
      return users;
    } catch (error) {
      this.logger.error(`❌ GET /v1/umx - Erro ao consultar banco: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    this.logger.log(`🔵 GET /v1/umx/${id} - Buscando usuário específico`);
    
    try {
      // Verificar se é UUID ou ID numérico
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      let user;
      if (isUuid) {
        this.logger.log(`🔍 Consultando usuário com UUID: ${id} no banco...`);
        user = await this.usersService.findByUuid(id);
      } else {
        this.logger.log(`🔍 Consultando usuário com ID: ${id} no banco...`);
        user = await this.usersService.findOne(+id);
      }
      
      this.logger.log(`✅ GET /v1/umx/${id} - Usuário encontrado no banco`);
      this.logger.log(`📤 Retornando usuário: ${JSON.stringify(user, null, 2)}`);
      return user;
    } catch (error) {
      this.logger.error(`❌ GET /v1/umx/${id} - Erro: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, skipMissingProperties: true }))
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    this.logger.log(`🔵 PATCH /v1/umx/${id} - Atualizando usuário`);
    this.logger.log(`📝 Dados para atualização: ${JSON.stringify(updateUserDto, null, 2)}`);
    
    try {
      const user = await this.usersService.update(+id, updateUserDto);
      this.logger.log(`✅ PATCH /v1/umx/${id} - Usuário atualizado com sucesso no banco`);
      this.logger.log(`📤 Retornando usuário atualizado: ${JSON.stringify(user, null, 2)}`);
      return user;
    } catch (error) {
      this.logger.error(`❌ PATCH /v1/umx/${id} - Erro: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    this.logger.log(`🔵 DELETE /v1/umx/${id} - Removendo usuário`);
    this.logger.log(`🗑️  Deletando usuário com ID: ${id} do banco...`);
    
    try {
      await this.usersService.remove(+id);
      this.logger.log(`✅ DELETE /v1/umx/${id} - Usuário removido com sucesso do banco`);
    } catch (error) {
      this.logger.error(`❌ DELETE /v1/umx/${id} - Erro: ${error.message}`, error.stack);
      throw error;
    }
  }
}