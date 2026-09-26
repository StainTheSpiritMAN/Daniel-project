import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { hashPassword } from '../auth/auth.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const publicFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.user.findMany({
      select: publicFields,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(actorId: string, dto: CreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('A user with that email already exists.');
    }
    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name,
        role: dto.role,
        passwordHash: await hashPassword(dto.password),
      },
      select: publicFields,
    });
    await this.audit.log(actorId, 'CREATE', 'User', user.id, {
      email,
      role: dto.role,
    });
    return user;
  }

  async update(actorId: string, id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found.');

    const demoting = dto.role && dto.role !== 'ADMIN';
    const deactivating = dto.isActive === false;
    if (existing.role === 'ADMIN' && (demoting || deactivating)) {
      const otherAdmins = await this.prisma.user.count({
        where: { role: 'ADMIN', isActive: true, id: { not: id } },
      });
      if (otherAdmins === 0) {
        throw new BadRequestException(
          'There must always be at least one active admin.',
        );
      }
    }

    const data: Prisma.UserUpdateInput = {
      name: dto.name,
      role: dto.role,
      isActive: dto.isActive,
      email: dto.email?.toLowerCase().trim(),
    };
    if (dto.password) data.passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: publicFields,
    });

    // Deactivation or a password reset ends the user's existing sessions.
    if (deactivating || dto.password) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const { password: _password, ...logged } = dto;
    await this.audit.log(actorId, 'UPDATE', 'User', id, {
      ...logged,
      ...(dto.password ? { passwordReset: true } : {}),
    });
    return user;
  }
}
