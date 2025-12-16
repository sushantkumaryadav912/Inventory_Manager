import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<any>();
    const req = ctx.getRequest<any>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const response = isHttp
      ? exception.getResponse()
      : { message: 'Internal server error' };

    const errorMessage =
      typeof response === 'string'
        ? response
        : (response as any).message ?? 'Error';

    const isProduction = process.env.NODE_ENV === 'production';

    const payload = {
      statusCode: status,
      message: errorMessage,
      path: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
      requestId: (req as any).requestId,
      // Only include stack trace in non-production
      ...((!isProduction && exception instanceof Error) && { 
        stack: exception.stack 
      }),
    };

    // Structured logging
    const logPayload = {
      level: 'error',
      ...payload,
      stack: exception instanceof Error ? exception.stack : undefined,
      ...(exception instanceof Error && {
        name: exception.name,
        message: exception.message,
      }),
    };

    // Log full details to stdout (for Render logs)
    if (status >= 500) {
      this.logger.error(JSON.stringify(logPayload));
    } else {
      this.logger.warn(JSON.stringify(logPayload));
    }

    // Send sanitized response to client
    res.status(status).send(payload);
  }
}
