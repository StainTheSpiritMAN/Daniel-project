import { IsEmail, MaxLength } from 'class-validator';

export class SubscribeDto {
  @IsEmail()
  @MaxLength(160)
  email!: string;
}
