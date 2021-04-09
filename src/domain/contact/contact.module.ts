import { Module } from '@nestjs/common';
import { CompanyModule } from '../company/company.module';
import { ContactService } from './contact.service';
import { ContactResolver } from './contact.resolver';
import { ContactStageResolver } from './contact-stage/contact-stage.resolver';
import { ContactStageService } from './contact-stage/contact-stage.service';
import { ContactsFilterOptionsResolver } from './contact-filter-options/contacts-filter-options.resolver';
import { ContactsFilterOptionsService } from './contact-filter-options/contacts-filter-options.service';
import { ContactCreatedHandler } from 'src/domain/contact/domain-events/contact-created.handler';

@Module({
  imports: [CompanyModule],
  providers: [
    ContactService,
    ContactResolver,
    ContactsFilterOptionsService,
    ContactsFilterOptionsResolver,
    ContactStageService,
    ContactStageResolver,
    ContactCreatedHandler,
  ],
  exports: [ContactCreatedHandler],
})
export class ContactModule {}
