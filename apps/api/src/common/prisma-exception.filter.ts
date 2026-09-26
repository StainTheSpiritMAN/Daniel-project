import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/** Turns common Prisma errors into clear 4xx responses instead of 500s. */
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    error: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    const res = host.switchToHttp().getResponse<Response>();
    const send = (statusCode: number, message: string) =>
      res.status(statusCode).json({ statusCode, message });

    if (error instanceof Prisma.PrismaClientValidationError) {
      return send(HttpStatus.BAD_REQUEST, 'Some fields are missing or invalid.');
    }
    switch (error.code) {
      case 'P2002': {
        const fields = (error.meta?.target as string[] | undefined)?.join(', ');
        return send(HttpStatus.CONFLICT, `That ${fields ?? 'value'} is already in use.`);
      }
      case 'P2025':
        return send(HttpStatus.NOT_FOUND, 'Record not found.');
      case 'P2003':
        return send(HttpStatus.CONFLICT, 'This item is linked to other content and cannot be changed that way.');
      default:
        this.logger.error(error.message);
        return super.catch(error, host);
    }
  }
}
