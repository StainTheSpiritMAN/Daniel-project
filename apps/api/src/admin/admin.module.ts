import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminKeyGuard } from './admin-key.guard';
import { ContactModule } from '../contact/contact.module';

@Module({
  imports: [ContactModule],
  controllers: [AdminController],
  providers: [AdminKeyGuard],
})
export class AdminModule {}
