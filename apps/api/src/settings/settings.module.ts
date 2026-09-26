import { Module } from '@nestjs/common';
import {
  AdminSettingsController,
  PublicSettingsController,
} from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [PublicSettingsController, AdminSettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
