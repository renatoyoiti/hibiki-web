import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
      },
    });
    return;
  }

  // Erros de conexão com banco
  if (err.message?.includes('ECONNREFUSED') || err.message?.includes('connect')) {
    res.status(503).json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Serviço temporariamente indisponível',
        statusCode: 503,
      },
    });
    return;
  }

  console.error('[Unhandled Error]', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor',
      statusCode: 500,
    },
  });
}
