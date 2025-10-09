import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message || message,
    };

    // Log detalhado do erro
    this.logger.error(
      `🚨 Exception caught: ${request.method} ${request.url} - Status: ${status} - IP: ${request.ip}`,
      {
        error: exception instanceof Error ? exception.message : exception,
        stack: exception instanceof Error ? exception.stack : undefined,
        request: {
          method: request.method,
          url: request.url,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          body: this.sanitizeBody(request.body),
        },
      }
    );

    response.status(status).json(errorResponse);
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    
    // Remove campos sensíveis dos logs
    const sensitiveFields = ['password', 'passwordHash', 'token', 'accessToken', 'refreshToken'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}