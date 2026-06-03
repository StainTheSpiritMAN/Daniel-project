import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(@Body() dto: SubscribeDto) {
    await this.newsletterService.subscribe(dto);
    return { success: true, message: 'You are now subscribed to our updates.' };
  }
}
