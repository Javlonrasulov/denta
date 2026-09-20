import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 4000;
  const origins = config.get<string[]>('app.corsOrigins') ?? [];

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({
    origin: origins,
    credentials: true,
  });
  app.useWebSocketAdapter(new IoAdapter(app));
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Serve local uploads in development (STORAGE_DRIVER=local)
  const storageDriver = config.get<string>('app.storage.driver') ?? 'local';
  if (storageDriver === 'local') {
    const localDir =
      config.get<string>('app.storage.localDir') ??
      join(process.cwd(), '.uploads');
    app.useStaticAssets(localDir, { prefix: '/uploads/' });
  }

  const swagger = new DocumentBuilder()
    .setTitle('DENTA.UZ API')
    .setDescription('Central API for Client App, Doctor App, and Clinic CRM')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`DENTA.UZ API listening on http://localhost:${port}/api/v1`);
  // eslint-disable-next-line no-console
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}

void bootstrap();
