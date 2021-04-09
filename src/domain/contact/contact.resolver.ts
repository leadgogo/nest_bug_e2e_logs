import {
  Resolver,
  Query,
  ResolveField,
  Parent,
  Mutation,
  Args,
  Int,
} from '@nestjs/graphql';
import { CompanyService } from '../company/company.service';
import { Company } from '../company/company.entity';
import { ContactListArgs } from './args/contact-list.args';
import { InfiniteContactsArgs } from './args/infinite-contacts.args';
import { CreateContactInput } from './inputs/create-contact.input';
import { UpdateContactInput } from './inputs/update-contact.input';
import { Contact } from './contact.entity';
import { ContactService } from './contact.service';
import { ContactConnection } from './outputs/contact-connection.output';
import { ContactRepository } from './contact.repository';
import { RequestedScalarFields } from 'src/application/graphql/decorators/requested-fields.decorator';
import { Loader } from 'src/application/graphql/decorators/loader.decorator';
import { ToConnection } from 'src/application/graphql/lists/connection/to-connection.decorator';
import { ToListConfig } from 'src/application/graphql/lists/list-args/to-list-config.decorator';
import { CreateContactOutput } from 'src/domain/contact/outputs/create-contact.output';
import { UpdateContactOutput } from 'src/domain/contact/outputs/update-contact.output';

@Resolver(() => Contact)
export class ContactResolver {
  constructor(
    private contactService: ContactService,
    private companyService: CompanyService,
    private contactRepository: ContactRepository
  ) {}

  @Query(() => ContactConnection)
  async contacts(
    @Args() args: ContactListArgs,
    @ToListConfig() toListConfig: ToListConfig,
    @ToConnection() toConnection: ToConnection<Contact>
  ): Promise<ContactConnection> {
    const listConfig = toListConfig(args);
    const page = await this.contactService.getPage(listConfig);
    const connection = toConnection(page);
    return connection;
  }

  @Query(() => ContactConnection)
  async infiniteContacts(
    @Args() args: InfiniteContactsArgs,
    @ToListConfig() toListConfig: ToListConfig,
    @ToConnection() toConnection: ToConnection<Contact>
  ): Promise<ContactConnection> {
    const listConfig = toListConfig(args);
    const page = await this.contactService.getPage(listConfig);
    const connection = toConnection(page);
    return connection;
  }

  @Query(() => Contact)
  async contact(
    @Args('id', { type: () => Int }) id: number,
    @RequestedScalarFields() fields: string[]
  ): Promise<Contact> {
    return this.contactService.getOne(fields, id);
  }

  @ResolveField()
  firstName(@Parent() contact: Contact) {
    return contact.firstName;
  }

  @ResolveField()
  email(@Parent() contact: Contact) {
    return contact.email;
  }

  @ResolveField()
  async phoneCel(@Parent() contact: Contact) {
    if (typeof contact.company?.id !== 'undefined') {
      await this.companyService.ensureCurrentUserCanShowContactPhonenumbersToSalesPeople(
        contact.company.id
      );
    }
    return contact.phoneCel;
  }

  @ResolveField()
  phoneProxy(@Parent() contact: Contact) {
    return contact.phoneProxy;
  }

  @ResolveField()
  async company(
    @Parent() contact: Contact,
    @RequestedScalarFields() requestedFields: string[],
    @Loader() loader: Loader<number, Company>
  ) {
    const company = await loader(contact.company?.id, (companyIds) => {
      return this.companyService.getMany(requestedFields, companyIds);
    });
    return company;
  }

  @Mutation(() => CreateContactOutput, { name: 'createContact' })
  async create(
    @Args('input') input: CreateContactInput
  ): Promise<CreateContactOutput> {
    const contact = await this.contactService.create(input);
    return { contact };
  }

  @Mutation(() => UpdateContactOutput, { name: 'updateContact' })
  async update(
    @Args('input') input: UpdateContactInput
  ): Promise<UpdateContactOutput> {
    const contact = await this.contactService.update(input.contactId, input);
    return { contact };
  }
}
