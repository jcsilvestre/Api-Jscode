import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserSessionsService } from './user-sessions.service';
import { CreateUserSessionDto } from './dto/create-user-session.dto';
import { UpdateUserSessionDto } from './dto/update-user-session.dto';

@Controller('usx')
export class UserSessionsController {
  constructor(private readonly userSessionsService: UserSessionsService) {}

  @Post()
  create(@Body() createUserSessionDto: CreateUserSessionDto) {
    return this.userSessionsService.create(createUserSessionDto);
  }

  @Get()
  findAll() {
    return this.userSessionsService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.userSessionsService.findByUser(userId);
  }

  @Get('user/:userId/active')
  findActiveByUser(@Param('userId') userId: string) {
    return this.userSessionsService.findActiveByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userSessionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserSessionDto: UpdateUserSessionDto) {
    return this.userSessionsService.update(id, updateUserSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userSessionsService.remove(id);
  }

  @Post('create-session')
  createSession(
    @Body('userId') userId: string,
    @Body('ipAddress') ipAddress?: string,
    @Body('userAgent') userAgent?: string
  ) {
    return this.userSessionsService.createSession(userId, ipAddress, userAgent);
  }

  @Patch(':id/deactivate')
  deactivateSession(@Param('id') id: string) {
    return this.userSessionsService.deactivateSession(id);
  }

  @Patch('user/:userId/deactivate-all')
  deactivateAllUserSessions(@Param('userId') userId: string) {
    return this.userSessionsService.deactivateAllUserSessions(userId);
  }
}