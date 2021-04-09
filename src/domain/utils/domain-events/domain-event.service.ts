import { EntityManager } from '@mikro-orm/mysql';
import { Inject, Injectable, Type } from '@nestjs/common';
import { ContextIdFactory, ModuleRef, REQUEST } from '@nestjs/core';
import { DomainEvent } from 'src/domain/utils/domain-events/domain-event';
import { getDomainEventHandlers } from 'src/domain/utils/domain-events/domain-event-handler-registry';
import { DomainEventHandler } from 'src/domain/utils/domain-events/domain-event-handler.interface';

@Injectable()
export class DomainEventService {
  private events: DomainEvent[] = [];

  constructor(
    private moduleRef: ModuleRef,
    @Inject(REQUEST) private request: Record<string, unknown>,
    private em: EntityManager
  ) {}

  put(...events: DomainEvent[]) {
    this.events.push(...events);
  }

  async dispatchAllEvents() {
    const contextId = ContextIdFactory.getByRequest(this.request);
    while (this.events.length > 0) {
      // eslint-disable-next-line @leadgogo/no-orm-flush
      await this.em.flush();
      for (const event of this.events.slice()) {
        const handlerTypes = getDomainEventHandlers(
          event.constructor as Type<DomainEvent>
        );
        if (handlerTypes) {
          for (const handlerType of handlerTypes) {
            let handler: DomainEventHandler;
            try {
              handler = await this.moduleRef.resolve(handlerType, contextId, {
                strict: false,
              });
            } catch (error) {
              if (
                error.message &&
                new RegExp(/this provider does not exist in the current context/).test(
                  error.message
                )
                // /is marked as a scoped provider. Request and transient-scoped providers can't be used in combination with/,
              ) {
                handler = this.moduleRef.get(handlerType, { strict: false });
              } else {
                throw error;
              }
            }
            await handler.handle(event);
          }
        }
        this.events.splice(this.events.indexOf(event), 1);
      }
    }
  }
}
