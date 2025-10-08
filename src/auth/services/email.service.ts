import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: process.env.EMAIL_USER || 'no-reply@jcscode.com',
        pass: process.env.EMAIL_PASS || '143300Ju=',
      },
    });
  }

  async sendVerificationToken(email: string, token: string): Promise<boolean> {
    try {
      // Configuração do email
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'no-reply@jcscode.com',
        to: email,
        subject: 'Código de Verificação - JCS Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Código de Verificação</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h3 style="color: #007bff; font-size: 24px; margin: 0;">${token}</h3>
              <p style="color: #666; margin: 10px 0;">Este código é válido por 15 minutos</p>
            </div>
            <p style="color: #333;">Olá,</p>
            <p style="color: #333;">Use o código acima para verificar sua conta no JCS Code.</p>
            <p style="color: #333;">Se você não solicitou este código, ignore este email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">JCS Code - Sistema de Autenticação</p>
          </div>
        `,
      };

      // Enviar email
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado com sucesso:', result.messageId);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      
      // Fallback: mostrar token no console para desenvolvimento
      console.log(`
        ================================
        📧 EMAIL DE VERIFICAÇÃO (DEV)
        ================================
        Para: ${email}
        Token: ${token}
        Válido por: 15 minutos
        ================================
      `);
      
      return false;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    return this.sendVerificationToken(email, token);
  }
}