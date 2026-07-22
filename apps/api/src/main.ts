import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import helmet from 'helmet';
import { join } from 'path';

import { AppModule } from './app.module';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    );

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
      hsts:
        process.env.NODE_ENV ===
        'production',
    }),
  );

  app.use(
    '/uploads',
    express.static(
      join(process.cwd(), 'uploads'),
      {
        maxAge: '7d',
        index: false,
      },
    ),
  );

  const allowedOrigins = [
    'http://localhost:3000',
    'https://real-estate-lisbon-platform-amber.vercel.app',
    'https://real-estate-lisbon-platform-git-main-sghaierchaimas-projects.vercel.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      /*
       * Autorise les requêtes sans origine :
       * Postman, Railway, appels serveur, etc.
       */
      if (!origin) {
        callback(null, true);
        return;
      }

      const isStableOrigin =
        allowedOrigins.includes(origin);

      const isVercelDeployment =
        /^https:\/\/real-estate-lisbon-platform-[a-z0-9-]+-sghaierchaimas-projects\.vercel\.app$/.test(
          origin,
        );

      if (
        isStableOrigin ||
        isVercelDeployment
      ) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          `Origin ${origin} is not allowed by CORS`,
        ),
      );
    },
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PATCH',
      'PUT',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port =
    Number(process.env.PORT) || 3001;

  await app.listen(port, '0.0.0.0');

  console.log(
    `API running on port ${port}`,
  );
}

bootstrap();