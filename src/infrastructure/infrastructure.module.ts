import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { EmailModule } from 'src/infrastructure/email/email.module';
import { RedisModule } from '@leadgogo/backend-utils';

@Module({
  imports: [DatabaseModule, RedisModule, EmailModule],
})
export class InfrastructureModule {}
