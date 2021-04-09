import 'source-map-support/register';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { fromEnv } from '@leadgogo/backend-utils';
import { AppModule } from 'src/app.module';
import { configureApp } from 'src/configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const port = fromEnv('PORT');
  await app.listen(port, () => {
    Logger.log(`Listening at http://localhost:${port}`);
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
