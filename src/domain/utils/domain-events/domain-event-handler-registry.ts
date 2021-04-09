import { Type } from '@nestjs/common';
import { DomainEvent } from 'src/domain/utils/domain-events/domain-event';
import { DomainEventHandler } from 'src/domain/utils/domain-events/domain-event-handler.interface';

const registry = new Map<Type<DomainEvent>, Type<DomainEventHandler>[]>();

export function registerDomainEventHandler(
  eventType: Type<DomainEvent>,
  eventHandler: Type<DomainEventHandler>
) {
  let handlers = registry.get(eventType);
  if (!handlers) {
    handlers = [];
    registry.set(eventType, handlers);
  }
  handlers.push(eventHandler);
}

export function getDomainEventHandlers(eventType: Type<DomainEvent>) {
  return registry.get(eventType);
}
