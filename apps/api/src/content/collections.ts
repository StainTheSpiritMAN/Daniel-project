import type { Type } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  ClientDto,
  NewsPostDto,
  UpdateNewsPostDto,
  GalleryPhotoDto,
  ProjectDto,
  ServiceDto,
  TeamMemberDto,
  TitleDescriptionDto,
  UpdateClientDto,
  UpdateGalleryPhotoDto,
  UpdateProjectDto,
  UpdateServiceDto,
  UpdateTeamMemberDto,
  UpdateTitleDescriptionDto,
} from './dto/collection.dto';

/** Media fields safe to expose on the public site. */
export const publicMediaSelect = {
  id: true,
  path: true,
  alt: true,
  width: true,
  height: true,
  mimeType: true,
  variants: true,
} satisfies Prisma.MediaSelect;

export type CollectionDef = {
  /** URL segment (`/services`, `/admin/services`) and revalidation tag. */
  key: string;
  /** Name used in the audit log. */
  entity: string;
  /** Prisma client delegate, e.g. `prisma.service`. */
  delegate: 'service' | 'project' | 'galleryPhoto' | 'client' | 'teamMember' | 'coreValue' | 'whyPoint' | 'newsPost';
  createDto: Type<unknown>;
  updateDto: Type<unknown>;
  /** Foreign keys pointing at Media, paired with their relation name. */
  media: { field: string; relation: string }[];
  /** Human label for audit entries and error messages. */
  label: (row: Record<string, unknown>) => string;
  /** List order; defaults to the manual (drag-and-drop) order. */
  orderBy?: Record<string, 'asc' | 'desc'>[];
  /** Converts incoming values before saving (e.g. date strings). */
  toData?: (dto: Record<string, unknown>) => Record<string, unknown>;
};

export const COLLECTIONS: CollectionDef[] = [
  {
    key: 'services',
    entity: 'Service',
    delegate: 'service',
    createDto: ServiceDto,
    updateDto: UpdateServiceDto,
    media: [{ field: 'imageId', relation: 'image' }],
    label: (r) => String(r.title),
  },
  {
    key: 'projects',
    entity: 'Project',
    delegate: 'project',
    createDto: ProjectDto,
    updateDto: UpdateProjectDto,
    media: [],
    label: (r) => String(r.title),
  },
  {
    key: 'gallery',
    entity: 'GalleryPhoto',
    delegate: 'galleryPhoto',
    createDto: GalleryPhotoDto,
    updateDto: UpdateGalleryPhotoDto,
    media: [{ field: 'imageId', relation: 'image' }],
    label: (r) => String(r.caption),
  },
  {
    key: 'clients',
    entity: 'Client',
    delegate: 'client',
    createDto: ClientDto,
    updateDto: UpdateClientDto,
    media: [{ field: 'logoId', relation: 'logo' }],
    label: (r) => String(r.name),
  },
  {
    key: 'team',
    entity: 'TeamMember',
    delegate: 'teamMember',
    createDto: TeamMemberDto,
    updateDto: UpdateTeamMemberDto,
    media: [{ field: 'photoId', relation: 'photo' }],
    label: (r) => String(r.name),
  },
  {
    key: 'values',
    entity: 'CoreValue',
    delegate: 'coreValue',
    createDto: TitleDescriptionDto,
    updateDto: UpdateTitleDescriptionDto,
    media: [],
    label: (r) => String(r.title),
  },
  {
    key: 'why-us',
    entity: 'WhyPoint',
    delegate: 'whyPoint',
    createDto: TitleDescriptionDto,
    updateDto: UpdateTitleDescriptionDto,
    media: [],
    label: (r) => String(r.title),
  },
  {
    key: 'news',
    entity: 'NewsPost',
    delegate: 'newsPost',
    createDto: NewsPostDto,
    updateDto: UpdateNewsPostDto,
    media: [{ field: 'imageId', relation: 'image' }],
    label: (r) => String(r.title),
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    toData: (dto) => (typeof dto.date === 'string' ? { ...dto, date: new Date(`${dto.date}T00:00:00Z`) } : dto),
  },
];
