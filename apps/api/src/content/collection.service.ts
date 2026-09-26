import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, diffFields } from '../audit/audit.service';
import { RevalidateService } from '../common/revalidate.service';
import { MediaService } from '../media/media.service';
import { type CollectionDef, publicMediaSelect } from './collections';

type Row = Record<string, unknown> & { id: string; status: ContentStatus };

/**
 * One implementation of list / create / update / delete / reorder / publish
 * shared by every content collection described in `collections.ts`.
 */
@Injectable()
export class CollectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly revalidator: RevalidateService,
    private readonly media: MediaService,
  ) {}

  // Prisma delegates share the method shapes used here but not a common type.
  private repo(def: CollectionDef) {
    return this.prisma[def.delegate] as unknown as {
      findMany(args: object): Promise<Row[]>;
      findUnique(args: object): Promise<Row | null>;
      aggregate(args: object): Promise<{ _max: { sortOrder: number | null } }>;
      create(args: object): Promise<Row>;
      update(args: object): Promise<Row>;
      delete(args: object): Promise<Row>;
    };
  }

  private include(def: CollectionDef) {
    if (!def.media.length) return undefined;
    return Object.fromEntries(def.media.map((m) => [m.relation, { select: publicMediaSelect }]));
  }

  listPublished(def: CollectionDef) {
    return this.repo(def).findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: def.orderBy ?? [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: this.include(def),
    });
  }

  listAll(def: CollectionDef) {
    return this.repo(def).findMany({
      orderBy: def.orderBy ?? [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: this.include(def),
    });
  }

  async get(def: CollectionDef, id: string) {
    const row = await this.repo(def).findUnique({ where: { id }, include: this.include(def) });
    if (!row) throw new NotFoundException(`${def.entity} not found.`);
    return row;
  }

  async create(def: CollectionDef, actorId: string, dto: Record<string, unknown>) {
    await this.checkMedia(def, dto);
    const max = await this.repo(def).aggregate({ _max: { sortOrder: true } });
    const row = await this.repo(def).create({
      data: { ...(def.toData?.(dto) ?? dto), sortOrder: (max._max.sortOrder ?? -1) + 1 },
      include: this.include(def),
    });
    await this.audit.log(actorId, 'CREATE', def.entity, row.id, dto);
    if (row.status === ContentStatus.PUBLISHED) this.revalidator.revalidate(def.key);
    return row;
  }

  async update(def: CollectionDef, actorId: string, id: string, dto: Record<string, unknown>) {
    const before = await this.get(def, id);
    for (const { field } of def.media) {
      if (dto[field] === '') dto[field] = null;
    }
    await this.checkMedia(def, dto);
    const row = await this.repo(def).update({ where: { id }, data: def.toData?.(dto) ?? dto, include: this.include(def) });

    const action =
      before.status !== row.status
        ? row.status === ContentStatus.PUBLISHED ? 'PUBLISH' : 'UNPUBLISH'
        : 'UPDATE';
    await this.audit.log(actorId, action, def.entity, id, diffFields(before, dto));
    if (before.status === ContentStatus.PUBLISHED || row.status === ContentStatus.PUBLISHED) {
      this.revalidator.revalidate(def.key);
    }
    return row;
  }

  setStatus(def: CollectionDef, actorId: string, id: string, status: ContentStatus) {
    return this.update(def, actorId, id, { status });
  }

  async remove(def: CollectionDef, actorId: string, id: string) {
    const row = await this.get(def, id);
    await this.repo(def).delete({ where: { id } });
    await this.audit.log(actorId, 'DELETE', def.entity, id, { label: def.label(row) });
    if (row.status === ContentStatus.PUBLISHED) this.revalidator.revalidate(def.key);
    return { success: true };
  }

  /** Persists a new order: `ids[0]` gets sortOrder 0, and so on. */
  async reorder(def: CollectionDef, actorId: string, ids: string[]) {
    const existing = await this.repo(def).findMany({ select: { id: true } } as object);
    const known = new Set(existing.map((r) => r.id));
    if (ids.length !== known.size || !ids.every((id) => known.has(id)) || new Set(ids).size !== ids.length) {
      throw new BadRequestException('The list changed while you were editing. Reload and try again.');
    }
    const repo = this.prisma[def.delegate] as unknown as {
      update(args: object): Prisma.PrismaPromise<unknown>;
    };
    await this.prisma.$transaction(
      ids.map((id, sortOrder) => repo.update({ where: { id }, data: { sortOrder } })),
    );
    await this.audit.log(actorId, 'REORDER', def.entity, null, { ids });
    this.revalidator.revalidate(def.key);
    return this.listAll(def);
  }

  private checkMedia(def: CollectionDef, dto: Record<string, unknown>) {
    return this.media.assertUsable(def.media.map((m) => dto[m.field] as string | null | undefined));
  }
}
