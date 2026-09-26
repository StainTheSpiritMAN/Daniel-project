import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaKind } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { promises as fs } from 'fs';
import { diskStorage } from 'multer';
import { tmpdir } from 'os';
import { Auth, CurrentUser, type AuthUser } from '../auth/auth.decorators';
import { PageQueryDto } from '../common/page-query.dto';
import { MAX_BYTES } from './file-signature';
import { MediaService } from './media.service';

class ListMediaQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(MediaKind)
  kind?: MediaKind;
}

class UploadMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  alt?: string;
}

class UpdateMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  alt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  filename?: string;
}

@Controller('admin/media')
@Auth()
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  list(@Query() query: ListMediaQueryDto) {
    return this.media.list(query);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const media = await this.media.findOne(id);
    return { ...media, usedBy: await this.media.usages(id) };
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({ destination: tmpdir() }),
      limits: { fileSize: MAX_BYTES.VIDEO, files: 1 },
    }),
  )
  async upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadMediaDto,
  ) {
    if (!file) throw new BadRequestException('No file was uploaded.');
    try {
      return await this.media.ingest({
        sourcePath: file.path,
        originalName: file.originalname,
        alt: dto.alt,
        uploadedById: user.id,
      });
    } finally {
      await fs.rm(file.path, { force: true });
    }
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMediaDto,
  ) {
    return this.media.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.media.remove(user.id, id);
  }
}
