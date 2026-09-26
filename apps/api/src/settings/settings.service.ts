import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, Role } from '@prisma/client';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, diffFields } from '../audit/audit.service';
import { RevalidateService } from '../common/revalidate.service';
import { MediaService } from '../media/media.service';
import { publicMediaSelect } from '../content/collections';
import { SETTINGS } from './dto/settings.dto';

/** Every string stored under a key ending in `Id` is a Media id. */
function collectMediaIds(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => collectMediaIds(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k.endsWith('Id') && typeof v === 'string' && v) out.add(v);
      else collectMediaIds(v, out);
    }
  }
  return out;
}

function flattenErrors(errors: ValidationError[], prefix = ''): string[] {
  return errors.flatMap((e) => {
    const path = prefix ? `${prefix}.${e.property}` : e.property;
    return [
      ...Object.values(e.constraints ?? {}).map((msg) => msg.replace(e.property, path)),
      ...flattenErrors(e.children ?? [], path),
    ];
  });
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly revalidator: RevalidateService,
    private readonly media: MediaService,
  ) {}

  private assertKey(key: string) {
    const def = SETTINGS[key];
    if (!def) throw new NotFoundException(`Unknown setting "${key}".`);
    return def;
  }

  /** All settings plus the media they reference, for the public site. */
  async getAllPublic() {
    const rows = await this.prisma.siteSetting.findMany();
    const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { values, media: await this.resolveMedia(values) };
  }

  async getPublic(key: string) {
    this.assertKey(key);
    const row = await this.prisma.siteSetting.findUnique({ where: { key } });
    const value = row?.value ?? null;
    return { key, value, media: await this.resolveMedia(value) };
  }

  async list() {
    const rows = await this.prisma.siteSetting.findMany({
      select: { key: true, updatedAt: true },
    });
    return Object.keys(SETTINGS).map((key) => ({
      key,
      adminOnly: !!SETTINGS[key].adminOnly,
      updatedAt: rows.find((r) => r.key === key)?.updatedAt ?? null,
    }));
  }

  async put(key: string, body: unknown, actor: { id: string; role: Role }) {
    const def = this.assertKey(key);
    if (def.adminOnly && actor.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can change these settings.');
    }

    const instance = plainToInstance(def.dto, body ?? {});
    const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) throw new BadRequestException(flattenErrors(errors));

    const value = instanceToPlain(instance) as Prisma.InputJsonObject;
    await this.media.assertUsable([...collectMediaIds(value)]);

    const before = await this.prisma.siteSetting.findUnique({ where: { key } });
    const row = await this.prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    await this.audit.log(
      actor.id,
      'UPDATE',
      'SiteSetting',
      key,
      diffFields(before?.value as Record<string, unknown> | null, value),
    );
    this.revalidator.revalidate('settings');
    return { key, value: row.value, media: await this.resolveMedia(row.value) };
  }

  private async resolveMedia(value: unknown) {
    const ids = [...collectMediaIds(value)];
    if (!ids.length) return {};
    const items = await this.prisma.media.findMany({
      where: { id: { in: ids } },
      select: publicMediaSelect,
    });
    return Object.fromEntries(items.map((m) => [m.id, m]));
  }
}
