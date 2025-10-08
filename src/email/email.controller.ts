import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { EmailService } from './email.service';

interface SendEmailDto {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface SendTestEmailDto {
  to: string;
}

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return this.emailService.sendEmail(
      sendEmailDto.to,
      sendEmailDto.subject,
      sendEmailDto.text,
      sendEmailDto.html,
    );
  }

  @Post('test')
  async sendTestEmail(@Body() sendTestEmailDto: SendTestEmailDto) {
    return this.emailService.sendTestEmail(sendTestEmailDto.to);
  }

  @Get('test')
  async sendTestEmailGet(@Query('to') to: string) {
    if (!to) {
      return {
        success: false,
        message: 'Parâmetro "to" é obrigatório',
      };
    }
    return this.emailService.sendTestEmail(to);
  }
}