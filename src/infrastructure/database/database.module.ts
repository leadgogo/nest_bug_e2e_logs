import { Global, Module, Scope } from '@nestjs/common';
import { BaseDatabaseModule, fromEnv } from '@leadgogo/backend-utils';
import { entities } from 'src/infrastructure/database/entities';
import { DatabaseQueryConfigApplier } from 'src/infrastructure/database/database-query-config-applier';
import { BaseRepository } from 'src/infrastructure/database/base.repository';

@Global()
@Module({
  imports: [
    BaseDatabaseModule.forRoot(fromEnv('DATABASE_URL'), entities, Scope.REQUEST, {
      entityRepository: BaseRepository,
    }),
  ],
  providers: [DatabaseQueryConfigApplier],
  exports: [DatabaseQueryConfigApplier],
})
export class DatabaseModule {}
