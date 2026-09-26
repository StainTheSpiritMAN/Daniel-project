import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(dto: SubscribeDto) {
    if (dto.website) return { subscribed: true };
    const email = dto.email.toLowerCase().trim();
    // Idempotent: re-subscribing with the same email is a no-op success.
    await this.prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { unsubscribedAt: null },
      create: { email },
    });
    return { subscribed: true };
  }

  list() {
    return this.prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async setSubscribed(id: string, subscribed: boolean) {
    return this.prisma.newsletterSubscriber.update({
      where: { id },
      data: { unsubscribedAt: subscribed ? null : new Date() },
    });
  }

  async exportCsv() {
    const rows = await this.prisma.newsletterSubscriber.findMany({
      where: { unsubscribedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    return [
      'email,subscribed_at',
      ...rows.map((r) => `${escape(r.email)},${r.createdAt.toISOString()}`),
    ].join('\n');
  }
}
