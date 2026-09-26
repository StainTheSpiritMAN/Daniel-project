import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { Auth, CurrentUser, type AuthUser } from '../auth/auth.decorators';
import { ContactService } from '../contact/contact.service';
import { ListContactQueryDto } from '../contact/dto/list-contact.dto';
import { UpdateStatusDto } from '../contact/dto/update-status.dto';
import { NewsletterService } from '../newsletter/newsletter.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

class SubscribedDto {
  @IsBoolean()
  subscribed!: boolean;
}

@Controller('admin/contact-messages')
@Auth()
export class AdminContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  list(@Query() query: ListContactQueryDto) {
    return this.contactService.findAll(query);
  }

  /** Cheap poll for the sidebar badge. Declared before `:id` so it matches first. */
  @Get('unread-count')
  async unreadCount() {
    return { unread: await this.contactService.countUnread() };
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.contactService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.contactService.updateStatus(id, dto.status);
  }
}

@Controller('admin/newsletter')
@Auth()
export class AdminNewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Get()
  list() {
    return this.newsletter.list();
  }

  @Get('export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="newsletter-subscribers.csv"')
  export() {
    return this.newsletter.exportCsv();
  }

  @Patch(':id')
  setSubscribed(@Param('id') id: string, @Body() dto: SubscribedDto) {
    return this.newsletter.setSubscribed(id, dto.subscribed);
  }
}

/** Numbers for the admin dashboard home. */
@Controller('admin/dashboard')
@Auth()
export class AdminDashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contact: ContactService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async summary(@CurrentUser() user: AuthUser) {
    const p = this.prisma;
    const isAdmin = user.role === 'ADMIN';
    const [services, projects, gallery, clients, team, values, whyUs, media, subscribers, unread, recent] =
      await Promise.all([
        p.service.count(),
        p.project.count(),
        p.galleryPhoto.count(),
        p.client.count(),
        p.teamMember.count(),
        p.coreValue.count(),
        p.whyPoint.count(),
        p.media.count(),
        p.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
        this.contact.countUnread(),
        // The activity log is admin-only, so editors get no entries.
        isAdmin ? this.audit.list(0, 5) : Promise.resolve(null),
      ]);
    return {
      counts: { services, projects, gallery, clients, team, values, whyUs, media, subscribers },
      unreadMessages: unread,
      recentActivity: recent?.items ?? null,
    };
  }
}
