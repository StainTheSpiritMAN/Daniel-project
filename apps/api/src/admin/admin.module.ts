import { Module } from '@nestjs/common';
import {
  AdminContactController,
  AdminDashboardController,
  AdminNewsletterController,
} from './admin.controller';
import { ContactModule } from '../contact/contact.module';
import { NewsletterModule } from '../newsletter/newsletter.module';

@Module({
  imports: [ContactModule, NewsletterModule],
  controllers: [
    AdminContactController,
    AdminNewsletterController,
    AdminDashboardController,
  ],
})
export class AdminModule {}
