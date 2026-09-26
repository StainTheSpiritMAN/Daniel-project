import { PartialType } from '@nestjs/mapped-types';
import { ContentStatus } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Field limits here are mirrored in the admin forms (apps/web admin schema)
 * so editors see the same limits before they hit Save.
 */
class StatusFields {
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class ServiceDto extends StatusFields {
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug may only contain lowercase letters, numbers and dashes.',
  })
  @MaxLength(80)
  slug!: string;

  @IsString() @IsNotEmpty() @MaxLength(80)
  title!: string;

  @IsString() @IsNotEmpty() @MaxLength(400)
  summary!: string;

  @IsArray() @ArrayMaxSize(12)
  @IsString({ each: true }) @IsNotEmpty({ each: true }) @MaxLength(160, { each: true })
  items!: string[];

  @IsOptional() @IsString()
  imageId?: string | null;
}

export class ProjectDto extends StatusFields {
  @IsString() @IsNotEmpty() @MaxLength(200)
  title!: string;

  @IsString() @IsNotEmpty() @MaxLength(120)
  client!: string;

  @IsString() @IsNotEmpty() @MaxLength(20)
  year!: string;

  @IsOptional() @IsString() @MaxLength(1000)
  description?: string | null;
}

export class GalleryPhotoDto extends StatusFields {
  @IsString() @IsNotEmpty()
  imageId!: string;

  @IsString() @IsNotEmpty() @MaxLength(140)
  caption!: string;
}

export class ClientDto extends StatusFields {
  @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @IsOptional() @IsString()
  logoId?: string | null;

  @IsOptional() @IsUrl({ require_protocol: true }, { message: 'Website must be a full URL, e.g. https://example.com' })
  @MaxLength(300)
  websiteUrl?: string | null;
}

export class TeamMemberDto extends StatusFields {
  @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @IsString() @IsNotEmpty() @MaxLength(160)
  role!: string;

  @IsArray() @ArrayMaxSize(8)
  @IsString({ each: true }) @IsNotEmpty({ each: true }) @MaxLength(2000, { each: true })
  bio!: string[];

  @IsOptional() @IsString()
  photoId?: string | null;
}

export class TitleDescriptionDto extends StatusFields {
  @IsString() @IsNotEmpty() @MaxLength(60)
  title!: string;

  @IsString() @IsNotEmpty() @MaxLength(240)
  description!: string;
}

export class NewsPostDto extends StatusFields {
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Web address may only contain lowercase letters, numbers and dashes.',
  })
  @MaxLength(100)
  slug!: string;

  @IsString() @IsNotEmpty() @MaxLength(140)
  title!: string;

  @IsDateString({ strict: true }, { message: 'date must be a date like 2026-09-26' })
  date!: string;

  @IsString() @IsNotEmpty() @MaxLength(200)
  highlight!: string;

  @IsString() @IsNotEmpty() @MaxLength(8000)
  body!: string;

  @IsString() @IsNotEmpty()
  imageId!: string;
}

export class UpdateServiceDto extends PartialType(ServiceDto) {}
export class UpdateProjectDto extends PartialType(ProjectDto) {}
export class UpdateGalleryPhotoDto extends PartialType(GalleryPhotoDto) {}
export class UpdateClientDto extends PartialType(ClientDto) {}
export class UpdateTeamMemberDto extends PartialType(TeamMemberDto) {}
export class UpdateNewsPostDto extends PartialType(NewsPostDto) {}
export class UpdateTitleDescriptionDto extends PartialType(TitleDescriptionDto) {}

export class ReorderDto {
  @IsArray() @ArrayMaxSize(500) @IsString({ each: true })
  ids!: string[];
}
