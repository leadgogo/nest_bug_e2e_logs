import {
  AuthenticationService,
  createUuid,
  IntegrationEventOriginType,
  IntegrationEventType,
  IntegrationEventTypePayloadMap,
} from '@leadgogo/backend-utils';
import { Injectable, Scope } from '@nestjs/common';
import { addMilliseconds } from 'date-fns';
import { IntegrationEventRepository } from 'src/domain/utils/integration-events/integration-event.repository';

@Injectable({ scope: Scope.REQUEST })
export class IntegrationEventService {
  constructor(
    private integrationEventRepository: IntegrationEventRepository,
    private authenticationService: AuthenticationService
  ) {}

  create<K extends IntegrationEventType>(
    type: K,
    payload: IntegrationEventTypePayloadMap[K],
    delayInMs: number = 0
  ) {
    const entity = this.integrationEventRepository.create({
      id: createUuid(),
      type,
      payload,
      originType: IntegrationEventOriginType.USER,
      originRef: this.authenticationService.currentUserId.toString(),
      emitAt: delayInMs > 0 ? addMilliseconds(new Date(), delayInMs) : null,
    });
    this.integrationEventRepository.persist(entity);
  }
}
