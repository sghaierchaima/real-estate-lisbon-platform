import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { validateEnv } from './config/env.validation';
import { PrismaModule } from './database/prisma.module';

import {
  ContactModule,
} from './modules/contact/contact.module';

import { AiModule } from './modules/ai/ai.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { CalculatorsModule } from './modules/calculators/calculators.module';
import { ChatModule } from './modules/chat/chat.module';
import { EmailModule } from './modules/email/email.module';
import { LeadsModule } from './modules/leads/leads.module';
import { MatchingModule } from './modules/matching/matching.module';
import { NeighborhoodsModule } from './modules/neighborhoods/neighborhoods.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SavedPropertiesModule } from './modules/saved-properties/saved-properties.module';
import { StatsModule } from './modules/stats/stats.module';
import { StoriesModule } from './modules/stories/stories.module';
import { UsersModule } from './modules/users/users.module';
import { BuyerJourneysModule } from './modules/buyer-journeys/buyer-journeys.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),

    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    ProfessionalsModule,
    LeadsModule,
    MatchingModule,
    StoriesModule,
    StatsModule,
    CalculatorsModule,
    EmailModule,
    NotificationsModule,
    ChatModule,
    NeighborhoodsModule,
    AiModule,
    AuditModule,
    SavedPropertiesModule,
    ReviewsModule,
    ContactModule,
    BuyerJourneysModule
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}