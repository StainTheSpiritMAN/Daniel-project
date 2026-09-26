import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  type Type,
  ValidationPipe,
} from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { Auth, CurrentUser, type AuthUser } from '../auth/auth.decorators';
import { CollectionService } from './collection.service';
import type { CollectionDef } from './collections';
import { ReorderDto } from './dto/collection.dto';

const bodyPipe = (expectedType: Type<unknown>) =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    expectedType,
  });

/**
 * Builds the public (read-only, published rows) and admin (full CRUD)
 * controllers for one collection.
 */
export function createCollectionControllers(def: CollectionDef): Type<unknown>[] {
  @Controller(def.key)
  class PublicCollectionController {
    constructor(private readonly collections: CollectionService) {}

    @Get()
    list() {
      return this.collections.listPublished(def);
    }
  }

  @Controller(`admin/${def.key}`)
  @Auth()
  class AdminCollectionController {
    constructor(private readonly collections: CollectionService) {}

    @Get()
    list() {
      return this.collections.listAll(def);
    }

    @Post('reorder')
    reorder(@CurrentUser() user: AuthUser, @Body() dto: ReorderDto) {
      return this.collections.reorder(def, user.id, dto.ids);
    }

    @Get(':id')
    get(@Param('id') id: string) {
      return this.collections.get(def, id);
    }

    @Post()
    create(
      @CurrentUser() user: AuthUser,
      @Body(bodyPipe(def.createDto)) dto: Record<string, unknown>,
    ) {
      return this.collections.create(def, user.id, dto);
    }

    @Patch(':id')
    update(
      @CurrentUser() user: AuthUser,
      @Param('id') id: string,
      @Body(bodyPipe(def.updateDto)) dto: Record<string, unknown>,
    ) {
      return this.collections.update(def, user.id, id, dto);
    }

    @Post(':id/publish')
    @HttpCode(HttpStatus.OK)
    publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
      return this.collections.setStatus(def, user.id, id, ContentStatus.PUBLISHED);
    }

    @Post(':id/unpublish')
    @HttpCode(HttpStatus.OK)
    unpublish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
      return this.collections.setStatus(def, user.id, id, ContentStatus.DRAFT);
    }

    @Delete(':id')
    remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
      return this.collections.remove(def, user.id, id);
    }
  }

  const suffix = def.entity;
  Object.defineProperty(PublicCollectionController, 'name', { value: `Public${suffix}Controller` });
  Object.defineProperty(AdminCollectionController, 'name', { value: `Admin${suffix}Controller` });
  return [PublicCollectionController, AdminCollectionController];
}
