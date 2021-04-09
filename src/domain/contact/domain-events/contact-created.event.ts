import { Contact } from 'src/domain/contact/contact.entity';
import { DomainEvent } from 'src/domain/utils/domain-events/domain-event';

export class ContactCreatedEvent extends DomainEvent<Contact> {
  constructor(entity: Contact) {
    super(entity);
  }
}
