import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Best-effort: an audit write failure must never fail the user's action. */
  async log(
    actorId: string | null,
    action: string,
    entity: string,
    entityId?: string | null,
    diff?: unknown,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action,
          entity,
          entityId: entityId ?? null,
          diff:
            diff === undefined
              ? Prisma.JsonNull
              : (JSON.parse(JSON.stringify(diff)) as Prisma.InputJsonValue),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log (${action} ${entity})`, error as Error);
    }
  }

  async list(skip = 0, take = 50) {
    take = Math.min(take, 100);
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { actor: { select: { name: true, email: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, skip, take };
  }
}

/** Shallow before/after diff of the fields that actually changed. */
export function diffFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
) {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, to] of Object.entries(after)) {
    if (key === 'updatedAt' || key === 'createdAt') continue;
    const from = before?.[key];
    if (JSON.stringify(from) !== JSON.stringify(to)) changes[key] = { from, to };
  }
  return changes;
}
