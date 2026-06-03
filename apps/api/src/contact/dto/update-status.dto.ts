import { IsEnum } from 'class-validator';
import { MessageStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(MessageStatus)
  status!: MessageStatus;
}
