import { Repository } from '@mikro-orm/core';
import { Contact } from 'src/domain/contact/contact.entity';
import { BaseRepository } from 'src/infrastructure/database/base.repository';

@Repository(Contact)
export class ContactRepository extends BaseRepository<Contact> {}
