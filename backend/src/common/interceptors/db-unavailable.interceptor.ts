import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ServiceUnavailableException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

function isDbUnavailable(err: any): boolean {
  const code = err?.code || err?.errorCode || err?.name;
  const msg = (err?.message || '').toString();
  return (
    code === 'P1001' ||
    code === 'PrismaClientInitializationError' ||
    msg.includes("Can't reach database server") ||
    msg.includes('ECONN') ||
    msg.includes('ENETUNREACH') ||
    msg.includes('ETIMEDOUT')
  );
}

@Injectable()
export class DbUnavailableInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        if (isDbUnavailable(err)) {
          return throwError(() => new ServiceUnavailableException({
            code: 'DB_UNREACHABLE',
            message: 'Database temporarily unreachable',
          }));
        }
        return throwError(() => err);
      }),
    );
  }
}
