import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, headers } = request;
    const ip = request.ip || request.connection.remoteAddress || 'Unknown';
    const userAgent = headers['user-agent'] || 'Unknown';
    const startTime = Date.now();

    // Log da requisição
    this.logger.log(
      `📥 ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent.substring(0, 100)}...`
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;
        
        this.logger.log(
          `📤 ${method} ${url} - ${statusCode} - ${duration}ms - IP: ${ip}`
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;
        
        this.logger.error(
          `❌ ${method} ${url} - ${statusCode} - ${duration}ms - IP: ${ip} - Error: ${error.message}`,
          error.stack
        );
        
        return throwError(() => error);
      })
    );
  }
}