import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHmac, randomBytes } from 'crypto';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AppConfig } from '../config/configuration';
import { LOCKOUT_MINUTES, MAX_FAILED_LOGINS } from './auth.constants';

const INVALID_LOGIN = 'Incorrect email or password.';

export type IssuedTokens = { accessToken: string; refreshToken: string };

export const hashPassword = (password: string) =>
  argon2.hash(password, { type: argon2.argon2id });

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly audit: AuditService,
  ) {}

  private get authConfig() {
    return this.config.get('auth', { infer: true });
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      // Still spend hashing time so response timing does not reveal accounts.
      await argon2.hash(password).catch(() => undefined);
      throw new UnauthorizedException(INVALID_LOGIN);
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Too many failed attempts. Try again later.',
      );
    }

    if (!(await argon2.verify(user.passwordHash, password))) {
      const failed = user.failedLoginCount + 1;
      const lock = failed >= MAX_FAILED_LOGINS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: lock ? 0 : failed,
          lockedUntil: lock
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
            : user.lockedUntil,
        },
      });
      throw new UnauthorizedException(INVALID_LOGIN);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await this.audit.log(user.id, 'LOGIN', 'User', user.id);

    return { user: this.toPublic(user), tokens: await this.issueTokens(user) };
  }

  /** Rotates a refresh token. Re-use of a spent token revokes the whole family. */
  async refresh(token: string | undefined) {
    if (!token) throw new UnauthorizedException('Not signed in.');

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { user: true },
    });
    if (!stored) throw new UnauthorizedException('Session expired.');

    if (stored.usedAt || stored.revokedAt) {
      await this.revokeFamily(stored.family);
      throw new UnauthorizedException('Session expired.');
    }
    if (stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException('Session expired.');
    }

    // Atomic claim: only one concurrent refresh with this token may succeed.
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) {
      await this.revokeFamily(stored.family);
      throw new UnauthorizedException('Session expired.');
    }

    return {
      user: this.toPublic(stored.user),
      tokens: await this.issueTokens(stored.user, stored.family),
    };
  }

  async logout(token: string | undefined) {
    if (!token) return;
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (stored) await this.revokeFamily(stored.family);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return this.toPublic(user);
  }

  async changePassword(userId: string, current: string, next: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!(await argon2.verify(user.passwordHash, current))) {
      throw new BadRequestException('Current password is incorrect.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(next) },
    });
    // Sign out every other session.
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log(userId, 'CHANGE_PASSWORD', 'User', userId);
  }

  private async issueTokens(user: User, family?: string): Promise<IssuedTokens> {
    const { accessTtlSeconds, refreshTtlSeconds } = this.authConfig;
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { expiresIn: accessTtlSeconds },
    );
    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        family: family ?? randomBytes(16).toString('hex'),
        expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
      },
    });
    return { accessToken, refreshToken };
  }

  private revokeFamily(family: string) {
    return this.prisma.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashToken(token: string) {
    return createHmac('sha256', this.authConfig.refreshSecret)
      .update(token)
      .digest('hex');
  }

  private toPublic(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
