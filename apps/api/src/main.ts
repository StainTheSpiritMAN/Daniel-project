import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { mkdirSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';
import type { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);

  const port = config.get('port', { infer: true });
  const globalPrefix = config.get('globalPrefix', { infer: true });
  const corsOrigins = config.get('corsOrigins', { infer: true });

  const uploads = config.get('uploads', { infer: true });

  // Behind nginx in production: trust the first proxy so req.ip (used for
  // rate limiting and contact logs) is the visitor's address.
  app.set('trust proxy', 1);
  app.use(
    helmet({
      // Uploaded images are embedded by the site, which runs on another port in dev.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  // nginx serves /uploads directly in production; this covers local dev.
  mkdirSync(uploads.dir, { recursive: true });
  app.useStaticAssets(uploads.dir, {
    prefix: uploads.publicPath,
    maxAge: '365d',
    immutable: true,
    index: false,
  });

  app.setGlobalPrefix(globalPrefix);
  app.useGlobalFilters(new PrismaExceptionFilter(app.get(HttpAdapterHost).httpAdapter));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(port);
  Logger.log(
    `🚀 Suburban API running at http://localhost:${port}/${globalPrefix}`,
    'Bootstrap',
  );
}

void bootstrap();
