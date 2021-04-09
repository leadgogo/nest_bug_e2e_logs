import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import {
  AuthenticationMiddleware,
  AuthenticationModule,
} from '@leadgogo/backend-utils';
import { SessionModule } from 'src/application/session/session.module';
import { GraphqlModule } from 'src/application/graphql/graphql.module';
import { AuthorizationModule } from 'src/application/authorization/authorization.module';
import { HealthCheckController } from 'src/application/health-check/health-check.controller';
import { DocsController } from 'src/application/docs/docs.controller';

@Module({
  imports: [
    AuthenticationModule,
    AuthorizationModule,
    SessionModule,
    GraphqlModule,
  ],
  controllers: [HealthCheckController, DocsController],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthenticationMiddleware)
      .exclude('/v(.+)/(auth/login|health|docs)')
      .forRoutes('*');
  }
}
