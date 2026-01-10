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

  private deriveErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'ERROR';
    }
  }

  private extractFieldErrors(response: any): Record<string, string> | undefined {
    const issues = Array.isArray(response?.issues)
      ? response.issues
      : Array.isArray(response?.errors)
        ? response.errors
        : undefined;

    if (!issues) return undefined;

    const fieldErrors: Record<string, string> = {};
    for (const issue of issues) {
      const path = Array.isArray(issue?.path)
        ? issue.path.join('.')
        : typeof issue?.path === 'string'
          ? issue.path
          : undefined;

      const key = path && path.length > 0 ? path : 'body';
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue?.message || 'Invalid value';
      }
    }

    return Object.keys(fieldErrors).length ? fieldErrors : undefined;
  }

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

    const responseObj = typeof response === 'string' ? { message: response } : (response as any);

    const message =
      Array.isArray(responseObj?.message)
        ? responseObj.message.join('; ')
        : responseObj?.message ?? 'Error';

    const fieldErrors =
      responseObj?.fieldErrors ?? this.extractFieldErrors(responseObj);

    const errorCode =
      responseObj?.errorCode ??
      (fieldErrors ? 'VALIDATION_ERROR' : this.deriveErrorCode(status));

    const isProduction = process.env.NODE_ENV === 'production';

    const payload = {
      statusCode: status,
      errorCode,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
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
      response: responseObj,
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
