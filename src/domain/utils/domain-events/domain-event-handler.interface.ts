import { DomainEvent } from 'src/domain/utils/domain-events/domain-event';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DomainEventHandler<T extends DomainEvent = any> {
  handle(event: T): void | Promise<void>;
}
