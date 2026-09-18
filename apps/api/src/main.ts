import {
  ValidationPipe,
} from '@nestjs/common';

import {
  NestFactory,
} from '@nestjs/core';

import {
  NestExpressApplication,
} from '@nestjs/platform-express';

import * as express from 'express';

import {
  mkdirSync,
} from 'fs';

import helmet from 'helmet';

import {
  join,
} from 'path';

import {
  AppModule,
} from './app.module';

// ============================================================
// BOOTSTRAP
// ============================================================

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    );

  // ============================================================
  // TRUST PROXY
  // ============================================================

  /*
   * Important pour Railway / reverse proxy.
   */
  app.set(
    'trust proxy',
    1,
  );

  // ============================================================
  // SECURITY
  // ============================================================

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy:
          'cross-origin',
      },

      /*
       * HSTS uniquement en production.
       */
      hsts:
        process.env.NODE_ENV ===
        'production',
    }),
  );

  // ============================================================
  // UPLOADS DIRECTORY
  // ============================================================

  /*
   * LOCAL :
   *
   * <project>/uploads
   *
   * RAILWAY :
   *
   * /app/uploads
   *
   * Si UPLOAD_ROOT est défini,
   * il sera utilisé automatiquement.
   */
  const uploadsRoot =
    process.env.UPLOAD_ROOT ||
    join(
      process.cwd(),
      'uploads',
    );

  // ============================================================
  // CREATE UPLOAD DIRECTORIES
  // ============================================================

  /*
   * Properties
   */
  mkdirSync(
    join(
      uploadsRoot,
      'properties',
    ),
    {
      recursive: true,
    },
  );

  /*
   * Avatars
   */
  mkdirSync(
    join(
      uploadsRoot,
      'avatars',
    ),
    {
      recursive: true,
    },
  );

  /*
   * Stories
   */
  mkdirSync(
    join(
      uploadsRoot,
      'stories',
    ),
    {
      recursive: true,
    },
  );

  // ============================================================
  // STATIC FILES
  // ============================================================

  /*
   * Exemple local :
   *
   * C:\...\uploads\avatars\photo.jpg
   *
   * devient :
   *
   * http://localhost:3001/uploads/avatars/photo.jpg
   *
   *
   * Exemple Railway :
   *
   * /app/uploads/properties/property.webp
   *
   * devient :
   *
   * https://backend-domain.up.railway.app/
   * uploads/properties/property.webp
   */
  app.use(
    '/uploads',
    express.static(
      uploadsRoot,
      {
        maxAge:
          '7d',

        index:
          false,
      },
    ),
  );

  // ============================================================
  // CORS
  // ============================================================

  /*
   * Origines stables connues.
   */
  const allowedOrigins = [
    // ----------------------------------------------------------
    // NEXT.JS LOCAL
    // ----------------------------------------------------------

    'http://localhost:3000',
    'http://127.0.0.1:3000',

    // ----------------------------------------------------------
    // EXPO WEB LOCAL
    // ----------------------------------------------------------

    'http://localhost:8081',
    'http://127.0.0.1:8081',

    // ----------------------------------------------------------
    // CURRENT LOCAL LAN
    // ----------------------------------------------------------

    'http://192.168.1.17:8081',

    // ----------------------------------------------------------
    // VERCEL PRODUCTION
    // ----------------------------------------------------------

    'https://real-estate-lisbon-platform-amber.vercel.app',

    'https://real-estate-lisbon-platform-git-main-sghaierchaimas-projects.vercel.app',
  ];

  app.enableCors({
    origin: (
      origin,
      callback,
    ) => {
      /*
       * Les apps mobiles natives,
       * Postman, certains appels serveur,
       * etc. peuvent ne pas envoyer
       * d'en-tête Origin.
       *
       * On les autorise.
       */
      if (!origin) {
        callback(
          null,
          true,
        );

        return;
      }

      // ----------------------------------------------------------
      // EXACT ALLOWED ORIGIN
      // ----------------------------------------------------------

      const isStableOrigin =
        allowedOrigins.includes(
          origin,
        );

      // ----------------------------------------------------------
      // LOCALHOST / 127.0.0.1
      // ----------------------------------------------------------

      /*
       * Autorise les ports locaux.
       *
       * Exemples :
       *
       * localhost:3000
       * localhost:8081
       * localhost:19006
       */
      const isLocalhost =
        /^http:\/\/localhost:\d+$/.test(
          origin,
        ) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(
          origin,
        );

      // ----------------------------------------------------------
      // LOCAL NETWORK
      // ----------------------------------------------------------

      /*
       * Autorise le réseau privé :
       *
       * 192.168.x.x
       *
       * Exemple :
       *
       * http://192.168.1.11:8081
       * http://192.168.1.15:8081
       *
       * Donc si l'IP du PC change,
       * le CORS continue de fonctionner.
       */
      const isLocalNetwork =
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/.test(
          origin,
        );

      // ----------------------------------------------------------
      // VERCEL PREVIEW DEPLOYMENTS
      // ----------------------------------------------------------

      /*
       * Autorise les previews Vercel
       * du projet.
       */
      const isVercelDeployment =
        /^https:\/\/real-estate-lisbon-platform-[a-z0-9-]+-sghaierchaimas-projects\.vercel\.app$/.test(
          origin,
        );

      // ----------------------------------------------------------
      // ALLOW
      // ----------------------------------------------------------

      if (
        isStableOrigin ||
        isLocalhost ||
        isLocalNetwork ||
        isVercelDeployment
      ) {
        callback(
          null,
          true,
        );

        return;
      }

      // ----------------------------------------------------------
      // BLOCK
      // ----------------------------------------------------------

      callback(
        new Error(
          `Origin ${origin} is not allowed by CORS`,
        ),
        false,
      );
    },

    credentials:
      true,

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
      'Accept',
    ],

    exposedHeaders: [
      'Content-Type',
      'Content-Length',
    ],
  });

  // ============================================================
  // GLOBAL VALIDATION
  // ============================================================

  app.useGlobalPipes(
    new ValidationPipe({
      /*
       * Supprime les propriétés
       * non définies dans les DTO.
       */
      whitelist:
        true,

      /*
       * Génère une erreur lorsqu'un
       * champ non autorisé est envoyé.
       */
      forbidNonWhitelisted:
        true,

      /*
       * Transforme automatiquement
       * les payloads selon les DTO.
       */
      transform:
        true,

      transformOptions: {
        enableImplicitConversion:
          true,
      },
    }),
  );

  // ============================================================
  // PORT
  // ============================================================

  const port =
    Number(
      process.env.PORT,
    ) ||
    3001;

  // ============================================================
  // START SERVER
  // ============================================================

  /*
   * IMPORTANT :
   *
   * 0.0.0.0 permet l'accès :
   *
   * - localhost
   * - navigateur
   * - Expo Web
   * - iPhone
   * - Android
   * - autres appareils du LAN
   * - Railway
   */
  await app.listen(
    port,
    '0.0.0.0',
  );

  // ============================================================
  // STARTUP LOGS
  // ============================================================

  console.log(
    '============================================',
  );

  console.log(
    `API running on port ${port}`,
  );

  console.log(
    `Local API: http://localhost:${port}`,
  );

  console.log(
    `Uploads directory: ${uploadsRoot}`,
  );

  console.log(
    'CORS configuration enabled',
  );

  console.log(
    '============================================',
  );
}

// ============================================================
// START APPLICATION
// ============================================================

void bootstrap();