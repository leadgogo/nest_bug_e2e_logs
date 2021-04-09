import { Injectable } from '@nestjs/common';
import { IntegrationEventType } from '@leadgogo/backend-utils';
import { ContactCreatedEvent } from 'src/domain/contact/domain-events/contact-created.event';
import { DomainEventHandler } from 'src/domain/utils/domain-events/domain-event-handler.interface';
import { OnDomainEvent } from 'src/domain/utils/domain-events/on-domain-event.decorator';
import { IntegrationEventService } from 'src/domain/utils/integration-events/integration-event.service';

@Injectable()
@OnDomainEvent(ContactCreatedEvent)
export class ContactCreatedHandler implements DomainEventHandler {
  constructor(private integrationEventService: IntegrationEventService) {}

  handle(event: ContactCreatedEvent) {
    this.integrationEventService.create(IntegrationEventType.CONTACT_CREATED, {
      contact: {
        id: event.entity.id,
        email: event.entity.email,
      },
    });
  }
}
