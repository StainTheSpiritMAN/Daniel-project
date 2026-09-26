import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import type { AppConfig } from '../config/configuration';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth.constants';
import { Auth, CurrentUser, type AuthUser } from './auth.decorators';
import { AuthService, type IssuedTokens } from './auth.service';
import { ChangePasswordDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.auth.login(dto.email, dto.password, req.ip ?? 'unknown');
    this.setCookies(res, tokens);
    return { user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { user, tokens } = await this.auth.refresh(
        req.cookies?.[REFRESH_COOKIE],
      );
      this.setCookies(res, tokens);
      return { user };
    } catch (error) {
      this.clearCookies(res);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    this.clearCookies(res);
    return { success: true };
  }

  @Get('me')
  @Auth()
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @Auth()
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    this.setCookies(res, tokens);
    return { success: true, message: 'Password updated.' };
  }

  private cookieBase(): CookieOptions {
    const { cookieSecure, cookieDomain } = this.config.get('auth', {
      infer: true,
    });
    return {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'lax',
      path: '/',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    };
  }

  private setCookies(res: Response, tokens: IssuedTokens) {
    const { accessTtlSeconds, refreshTtlSeconds } = this.config.get('auth', {
      infer: true,
    });
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...this.cookieBase(),
      maxAge: accessTtlSeconds * 1000,
    });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.cookieBase(),
      maxAge: refreshTtlSeconds * 1000,
    });
  }

  private clearCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, this.cookieBase());
    res.clearCookie(REFRESH_COOKIE, this.cookieBase());
  }
}
