import { Type } from '@nestjs/common';
import { DomainEvent } from 'src/domain/utils/domain-events/domain-event';
import { registerDomainEventHandler } from 'src/domain/utils/domain-events/domain-event-handler-registry';
import { DomainEventHandler } from 'src/domain/utils/domain-events/domain-event-handler.interface';

export function OnDomainEvent(
  ...eventTypes: Type<DomainEvent>[]
): ClassDecorator {
  return (target) => {
    for (const eventType of eventTypes) {
      registerDomainEventHandler(
        eventType,
        (target as unknown) as Type<DomainEventHandler>
      );
    }
  };
}
