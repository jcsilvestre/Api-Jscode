import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { ResendTokenDto } from './dto/resend-token.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify')
  async verifyToken(@Body(ValidationPipe) verifyTokenDto: VerifyTokenDto) {
    return this.authService.verifyToken(verifyTokenDto);
  }

  @Post('complete-registration')
  async completeRegistration(@Body(ValidationPipe) completeRegistrationDto: CompleteRegistrationDto) {
    return this.authService.completeRegistration(completeRegistrationDto);
  }

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('resend')
  async resendToken(@Body(ValidationPipe) resendTokenDto: ResendTokenDto) {
    return this.authService.resendToken(resendTokenDto);
  }
}
