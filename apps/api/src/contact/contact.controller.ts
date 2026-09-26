import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async create(@Body() dto: CreateContactDto, @Req() req: Request) {
    const result = await this.contactService.create(dto, {
      ip: req.ip,
      userAgent: req.header('user-agent')?.slice(0, 300),
    });
    return {
      success: true,
      message: 'Thank you for reaching out. We will get back to you shortly.',
      data: result,
    };
  }
}
