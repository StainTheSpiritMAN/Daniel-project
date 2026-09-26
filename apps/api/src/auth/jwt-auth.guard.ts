import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ACCESS_COOKIE } from './auth.constants';

/**
 * Verifies the access token (httpOnly cookie, or `Authorization: Bearer`) and
 * re-loads the user so deactivated accounts and role changes apply immediately.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token =
      req.cookies?.[ACCESS_COOKIE] ??
      req.header('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Not signed in.');

    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Session expired.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is disabled.');
    }

    (req as Request & { user: unknown }).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return true;
  }
}
