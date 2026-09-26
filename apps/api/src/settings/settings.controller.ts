import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { Auth, CurrentUser, type AuthUser } from '../auth/auth.decorators';
import { SettingsService } from './settings.service';

@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  all() {
    return this.settings.getAllPublic();
  }

  @Get(':key')
  one(@Param('key') key: string) {
    return this.settings.getPublic(key);
  }
}

@Controller('admin/settings')
@Auth()
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  list() {
    return this.settings.list();
  }

  @Get(':key')
  get(@Param('key') key: string) {
    return this.settings.getPublic(key);
  }

  /** Body is validated per key inside the service (shape differs per key). */
  @Put(':key')
  put(
    @CurrentUser() user: AuthUser,
    @Param('key') key: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.settings.put(key, body, user);
  }
}
