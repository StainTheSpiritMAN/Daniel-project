import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { AppConfig } from '../config/configuration';

export interface MailPayload {
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly mail: AppConfig['mail'];

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    this.mail = this.config.get('mail', { infer: true });
  }

  onModuleInit(): void {
    if (!this.mail.host) {
      this.logger.warn(
        'SMTP_HOST is not set — emails will be logged to the console instead of sent.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: this.mail.host,
      port: this.mail.port,
      secure: this.mail.secure,
      auth: this.mail.user
        ? { user: this.mail.user, pass: this.mail.password }
        : undefined,
    });
  }

  /** Send a notification to the company inbox (MAIL_TO). */
  async sendToInbox(payload: MailPayload): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `[DEV EMAIL] To: ${this.mail.to}\nSubject: ${payload.subject}\n${payload.text}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.mail.from,
      to: this.mail.to,
      replyTo: payload.replyTo,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    this.logger.log(`Email sent to ${this.mail.to}: ${payload.subject}`);
  }
}
