import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { Conducteur } from './conducteurs/entities/conducteur.entity';
import { Assignation } from './assignations/entities/assignation.entity';
import { ConducteursModule } from './conducteurs/conducteurs.module';
import { AssignationsModule } from './assignations/assignations.module';
import { KafkaModule } from './kafka/kafka.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('database.url'),
        entities: [Conducteur, Assignation],
        synchronize: true,
        logging: process.env.NODE_ENV !== 'production',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    ConducteursModule,
    AssignationsModule,
    KafkaModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
