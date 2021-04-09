import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { ApiErrorFilter } from 'src/application/errors/api-error/api-error.filter';
import { InputValidationApiError } from 'src/application/errors/api-error/input-validation.api-error';
import { SessionModule } from 'src/application/session/session.module';
import { AppModule } from './app.module';
import { CustomValidation } from './utils/validation/custom-validation.pipe';

export function configureApp(app: INestApplication) {
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useGlobalFilters(new ApiErrorFilter());
  app.useGlobalPipes(
    new CustomValidation({
      exceptionFactory: (errors) => {
        return new InputValidationApiError(errors);
      },
      disableErrorMessages: true,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  const docsConfig = new DocumentBuilder()
    .setTitle('Leadgogo Web API')
    .setVersion('1.0')
    .build();
  const docs = SwaggerModule.createDocument(app, docsConfig, {
    include: [SessionModule],
  });
  SwaggerModule.setup('v1/docs/openapi', app, docs);
}
