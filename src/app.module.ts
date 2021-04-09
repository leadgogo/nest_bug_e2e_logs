import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { RequestIdMiddleware } from './application/middleware/request-id.middleware';
import { PermissionsGuard } from './utils/guards/permissions.guard';
import { ApplicationModule } from 'src/application/application.module';
import { configuration } from 'src/config/all.config';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { DomainModule } from 'src/domain/domain.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ApplicationModule,
    DomainModule,
    InfrastructureModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
