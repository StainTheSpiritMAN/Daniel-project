import {
  BadRequestException,
  HttpException,
  HttpStatus,
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
import { REFRESH_REUSE_GRACE_MS } from './auth.constants';
import { LoginAttempts } from './login-attempts';

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
    private readonly attempts: LoginAttempts,
  ) {}

  private get authConfig() {
    return this.config.get('auth', { infer: true });
  }

  async login(email: string, password: string, ip: string) {
    // Checked before looking the account up, so the answer is the same
    // whether or not the email exists.
    if (this.attempts.isBlocked(ip, email)) {
      throw new HttpException(
        'Too many failed attempts from this network. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    const valid = user?.isActive
      ? await argon2.verify(user.passwordHash, password)
      : // Still spend hashing time so response timing does not reveal accounts.
        await argon2.hash(password).then(() => false, () => false);

    if (!user || !valid) {
      this.attempts.recordFailure(ip, email);
      throw new UnauthorizedException(INVALID_LOGIN);
    }

    this.attempts.clear(ip, email);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
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

    if (stored.revokedAt || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException('Session expired.');
    }

    // Mark the token used. If it was already used, allow it only within a short
    // grace period (parallel tabs); a later replay means the token leaked, so
    // the whole session is ended.
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) {
      const current = await this.prisma.refreshToken.findUnique({ where: { id: stored.id } });
      const withinGrace =
        current?.usedAt && !current.revokedAt && Date.now() - current.usedAt.getTime() < REFRESH_REUSE_GRACE_MS;
      if (!withinGrace) {
        await this.revokeFamily(stored.family);
        throw new UnauthorizedException('Session expired.');
      }
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

  /**
   * Changes the password, ends every existing session, and returns fresh
   * tokens so the device that made the change stays signed in.
   */
  async changePassword(userId: string, current: string, next: string): Promise<IssuedTokens> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!(await argon2.verify(user.passwordHash, current))) {
      throw new BadRequestException('Current password is incorrect.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(next), sessionsValidFrom: new Date() },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log(userId, 'CHANGE_PASSWORD', 'User', userId);
    return this.issueTokens(user);
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
