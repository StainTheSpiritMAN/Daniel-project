import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import type { Role } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './auth.constants';

/**
 * Requires a signed-in, active staff account. Pass roles to restrict further,
 * e.g. `@Auth('ADMIN')`. With no roles, any signed-in user is allowed.
 */
export const Auth = (...roles: Role[]) =>
  applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest().user,
);
