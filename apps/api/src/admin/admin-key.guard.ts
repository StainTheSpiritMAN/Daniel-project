import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AppConfig } from '../config/configuration';

/**
 * Guards admin routes with a shared secret supplied via the `x-admin-key`
 * header (or `Authorization: Bearer <key>`). The expected key comes from
 * ADMIN_API_KEY. If that env var is unset, all admin access is denied.
 */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get('adminApiKey', { infer: true });
    if (!expected) {
      throw new UnauthorizedException(
        'Admin access is not configured (ADMIN_API_KEY is unset).',
      );
    }

    const req = context.switchToHttp().getRequest<Request>();
    const headerKey = req.header('x-admin-key');
    const bearer = req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const provided = headerKey || bearer;

    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid or missing admin key.');
    }
    return true;
  }
}
