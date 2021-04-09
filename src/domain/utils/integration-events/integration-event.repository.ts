import { Repository } from '@mikro-orm/core';
import { IntegrationEvent } from '@leadgogo/backend-utils';
import { BaseRepository } from 'src/infrastructure/database/base.repository';

@Repository(IntegrationEvent)
export class IntegrationEventRepository extends BaseRepository<IntegrationEvent> {}
