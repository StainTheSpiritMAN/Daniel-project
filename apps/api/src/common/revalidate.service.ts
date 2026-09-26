import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/configuration';

/**
 * Tells the Next.js site to drop cached pages for the given content tags so
 * published changes appear within seconds. Fire-and-forget: the site also
 * re-fetches on a timer, so a failed ping only delays the update.
 */
@Injectable()
export class RevalidateService {
  private readonly logger = new Logger(RevalidateService.name);

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  revalidate(...tags: string[]) {
    const { url, revalidateSecret } = this.config.get('web', { infer: true });
    if (!revalidateSecret) return;

    fetch(`${url}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': revalidateSecret,
      },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(5000),
    })
      .then((res) => {
        if (!res.ok) this.logger.warn(`Revalidate [${tags}] → HTTP ${res.status}`);
      })
      .catch((error: Error) =>
        this.logger.warn(`Revalidate [${tags}] failed: ${error.message}`),
      );
  }
}
