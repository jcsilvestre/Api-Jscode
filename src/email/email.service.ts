import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'no-reply@jcscode.com',
        pass: '143300Ju=',
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    try {
      const mailOptions = {
        from: 'no-reply@jcscode.com',
        to,
        subject,
        text,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId,
        message: 'Email enviado com sucesso',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Erro ao enviar email',
      };
    }
  }

  async sendTestEmail(to: string) {
    const subject = 'Email de Teste - Sistema JCS Code';
    const text = 'Este é um email de teste do sistema JCS Code.';
    const html = `
      <h2>Email de Teste</h2>
      <p>Este é um email de teste do sistema <strong>JCS Code</strong>.</p>
      <p>Se você recebeu este email, a configuração está funcionando corretamente!</p>
      <hr>
      <small>Sistema JCS Code - ${new Date().toLocaleString('pt-BR')}</small>
    `;

    return this.sendEmail(to, subject, text, html);
  }

  async sendInvitationEmail(to: string, inviterName: string, groupName: string, invitationLink: string) {
    const subject = `Convite para participar do grupo: ${groupName}`;
    const text = `${inviterName} convidou você para participar do grupo "${groupName}". Acesse o link: ${invitationLink}`;
    const html = `
      <h2>Você foi convidado!</h2>
      <p><strong>${inviterName}</strong> convidou você para participar do grupo:</p>
      <h3>${groupName}</h3>
      <p>
        <a href="${invitationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Aceitar Convite
        </a>
      </p>
      <p>Ou copie e cole este link no seu navegador:</p>
      <p><code>${invitationLink}</code></p>
      <hr>
      <small>Sistema JCS Code - ${new Date().toLocaleString('pt-BR')}</small>
    `;

    return this.sendEmail(to, subject, text, html);
  }
}