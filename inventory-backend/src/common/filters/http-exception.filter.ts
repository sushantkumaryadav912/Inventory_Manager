import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
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

    const payload = {
      statusCode: status,
      message: errorMessage,
      path: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
      requestId: (req as any).requestId,
    };

    // Structured log (stdout)
    console.error(
      JSON.stringify({
        level: 'error',
        ...payload,
        stack:
          exception instanceof Error ? exception.stack : undefined,
      }),
    );

    // Works for both Fastify (reply.status().send) and Express (res.status().send)
    res.status(status).send(payload);
  }
}
