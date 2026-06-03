import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MessageStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateContactDto) {
    const message = await this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        subject: dto.subject,
        service: dto.service,
        message: dto.message,
      },
    });

    // Notify the company inbox. Failures here must not break the submission.
    try {
      await this.mail.sendToInbox({
        subject: `New enquiry: ${dto.subject ?? dto.service ?? 'Website contact form'}`,
        replyTo: dto.email,
        text: this.buildEmailText(dto),
      });
    } catch (error) {
      this.logger.error('Failed to send contact notification email', error as Error);
    }

    return { id: message.id, createdAt: message.createdAt };
  }

  /** Admin: list submissions, newest first, optionally filtered by status. */
  async findAll(params: { status?: MessageStatus; skip?: number; take?: number }) {
    const where: Prisma.ContactMessageWhereInput = params.status
      ? { status: params.status }
      : {};
    const take = Math.min(params.take ?? 50, 100);
    const skip = params.skip ?? 0;

    const [items, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  /** Admin: fetch a single submission. */
  async findOne(id: string) {
    const message = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Contact message not found.');
    return message;
  }

  /** Admin: change the workflow status of a submission. */
  async updateStatus(id: string, status: MessageStatus) {
    await this.findOne(id);
    return this.prisma.contactMessage.update({ where: { id }, data: { status } });
  }

  private buildEmailText(dto: CreateContactDto): string {
    return [
      `Name:    ${dto.name}`,
      `Email:   ${dto.email}`,
      `Phone:   ${dto.phone ?? '-'}`,
      `Service: ${dto.service ?? '-'}`,
      `Subject: ${dto.subject ?? '-'}`,
      '',
      dto.message,
    ].join('\n');
  }
}
