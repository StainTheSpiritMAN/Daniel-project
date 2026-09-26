import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/*
 * One class per SiteSetting key. Limits are mirrored in the admin form schema
 * (apps/web/src/app/(admin)/admin/_lib/schema.ts) — keep the two in sync.
 */

const Text = (max: number) => (target: object, key: string) => {
  IsString()(target, key);
  IsNotEmpty()(target, key);
  MaxLength(max)(target, key);
};
const OptionalText = (max: number) => (target: object, key: string) => {
  IsOptional()(target, key);
  IsString()(target, key);
  MaxLength(max)(target, key);
};
const TextList = (maxItems: number, maxLength: number) => (target: object, key: string) => {
  IsArray()(target, key);
  ArrayMaxSize(maxItems)(target, key);
  IsString({ each: true })(target, key);
  IsNotEmpty({ each: true })(target, key);
  MaxLength(maxLength, { each: true })(target, key);
};
const MediaId = () => (target: object, key: string) => {
  IsOptional()(target, key);
  IsString()(target, key);
};
const Nested = <T>(cls: () => new () => T) => (target: object, key: string) => {
  IsObject({ message: `${key} is required` })(target, key);
  ValidateNested()(target, key);
  Type(cls)(target, key);
};

export class HeadingDto {
  @Text(40) eyebrow!: string;
  @Text(120) title!: string;
  @OptionalText(300) subtitle?: string;
}

export class LinkDto {
  @Text(40) label!: string;
  @Text(200) href!: string;
}

export class TitleBodyDto {
  @Text(120) title!: string;
  @Text(1500) body!: string;
}

export class StatDto {
  @Text(12) value!: string;
  @Text(80) label!: string;
}

export class CompanySettings {
  @Text(120) name!: string;
  @Text(80) shortName!: string;
  @Text(80) tagline!: string;
  @Text(400) intro!: string;
  @Text(120) website!: string;

  @IsArray() @ArrayMaxSize(4) @IsEmail({}, { each: true })
  emails!: string[];

  @TextList(4, 30) phones!: string[];
  @Text(300) address!: string;

  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(500)
  mapUrl?: string;
}

export class HeroSettings {
  @Text(60) badge!: string;
  @Text(90) headline!: string;
  /** Part of the headline shown in gold. Must appear in `headline` to take effect. */
  @OptionalText(60) highlight?: string;
  @Text(300) subtext!: string;
  @Nested(() => LinkDto) primaryCta!: LinkDto;
  @Nested(() => LinkDto) secondaryCta!: LinkDto;

  @IsArray() @ArrayMaxSize(4) @ValidateNested({ each: true }) @Type(() => StatDto)
  stats!: StatDto[];

  @MediaId() videoId?: string;
  @MediaId() videoWebmId?: string;
  @MediaId() posterId?: string;
}

export class HomeSettings {
  @Nested(() => HeadingDto) aboutHeading!: HeadingDto;
  @TextList(4, 1200) aboutParagraphs!: string[];
  @Nested(() => HeadingDto) servicesHeading!: HeadingDto;
  @Nested(() => HeadingDto) whyHeading!: HeadingDto;
  @MediaId() whyImageId?: string;
  @OptionalText(140) whyImageCaption?: string;
  @Nested(() => HeadingDto) clientsHeading!: HeadingDto;
}

export class AboutSettings {
  @OptionalText(300) metaDescription?: string;
  @Nested(() => HeadingDto) header!: HeadingDto;
  @TextList(8, 1200) paragraphs!: string[];
  @MediaId() imageId?: string;
  @Nested(() => TitleBodyDto) consultancy!: TitleBodyDto;
  @Nested(() => TitleBodyDto) expertise!: TitleBodyDto;
  @Nested(() => HeadingDto) ceoHeading!: HeadingDto;
  @Nested(() => HeadingDto) valuesHeading!: HeadingDto;
  @Nested(() => HeadingDto) managementHeading!: HeadingDto;
}

export class MissionVisionSettings {
  @Text(600) mission!: string;
  @Text(600) vision!: string;
}

export class CeoSettings {
  @Text(120) name!: string;
  @Text(160) title!: string;
  @Text(200) thankYou!: string;
  @TextList(8, 1500) statement!: string[];
  @MediaId() photoId?: string;
}

export class ServicesPageSettings {
  @OptionalText(300) metaDescription?: string;
  @Nested(() => HeadingDto) header!: HeadingDto;
  @MediaId() headerImageId?: string;
}

export class ProjectsPageSettings {
  @OptionalText(300) metaDescription?: string;
  @Nested(() => HeadingDto) header!: HeadingDto;
  @Nested(() => HeadingDto) galleryHeading!: HeadingDto;
  @Nested(() => HeadingDto) clientsHeading!: HeadingDto;
}

export class ContactPageSettings {
  @OptionalText(300) metaDescription?: string;
  @Nested(() => HeadingDto) header!: HeadingDto;
  @Nested(() => TitleBodyDto) intro!: TitleBodyDto;
}

export class CtaSettings {
  @Text(120) title!: string;
  @Text(400) body!: string;
  @Nested(() => LinkDto) primaryCta!: LinkDto;
  @Nested(() => LinkDto) secondaryCta!: LinkDto;
}

export class SeoSettings {
  @Text(90) defaultTitle!: string;
  @Text(300) defaultDescription!: string;
  @TextList(25, 60) keywords!: string[];
  @MediaId() ogImageId?: string;
}

export const SETTINGS: Record<string, { dto: new () => object; adminOnly?: boolean }> = {
  company: { dto: CompanySettings },
  hero: { dto: HeroSettings },
  home: { dto: HomeSettings },
  about: { dto: AboutSettings },
  missionVision: { dto: MissionVisionSettings },
  ceo: { dto: CeoSettings },
  servicesPage: { dto: ServicesPageSettings },
  projectsPage: { dto: ProjectsPageSettings },
  contactPage: { dto: ContactPageSettings },
  cta: { dto: CtaSettings },
  seo: { dto: SeoSettings, adminOnly: true },
};
