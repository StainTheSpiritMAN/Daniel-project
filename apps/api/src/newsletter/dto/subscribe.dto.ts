import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubscribeDto {
  @IsEmail()
  @MaxLength(160)
  email!: string;

  /** Honeypot (see CreateContactDto.website). */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
