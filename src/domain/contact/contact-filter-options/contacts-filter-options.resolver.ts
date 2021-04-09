import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AncestorArg } from 'src/application/graphql/decorators/ancestor-arg.decorator';
import { RequestedScalarFields } from 'src/application/graphql/decorators/requested-fields.decorator';
import { ToConnection } from 'src/application/graphql/lists/connection/to-connection.decorator';
import { ToListConfig } from 'src/application/graphql/lists/list-args/to-list-config.decorator';
import { User } from '../../user/user.entity';
import { ContactStage } from '../contact-stage/contact-stage.entity';
import { ContactStageService } from '../contact-stage/contact-stage.service';
import { ContactTag } from '../contact-tag/contact-tag.entity';
import { ContactTagArgs } from './args/contact-tag.args';
import { ContactsFilterOptionsService } from './contacts-filter-options.service';
import { ContactTagConnection } from './outputs/contact-tag-connection.output';
import { ContactsFilterOptionsOutput } from './outputs/contacts-filter-options.output';

@Resolver(ContactsFilterOptionsOutput)
export class ContactsFilterOptionsResolver {
  constructor(
    private contactsFilterOptionsService: ContactsFilterOptionsService,
    private contactStageService: ContactStageService
  ) {}

  @Query(() => ContactsFilterOptionsOutput)
  contactsFilterOptions(
    @Args('institutionId', { type: () => Int }) _: number
  ): ContactsFilterOptionsOutput {
    return {};
  }

  @ResolveField(() => [ContactStage])
  async stages(
    @Parent() filter: ContactsFilterOptionsOutput,
    @RequestedScalarFields() fields: string[]
  ) {
    return this.contactStageService.getAll(fields);
  }

  @ResolveField(() => [User])
  async accounts(
    @Parent() filter: ContactsFilterOptionsOutput,
    @RequestedScalarFields() fields: string[],
    @AncestorArg('institutionId') institutionId: number,
    @Args('active', { type: () => Boolean, nullable: true })
    active?: boolean
  ) {
    return this.contactsFilterOptionsService.getAccounts(
      institutionId,
      fields,
      active
    );
  }

  @ResolveField(() => ContactTagConnection)
  async tags(
    @Parent() filter: ContactsFilterOptionsOutput,
    @AncestorArg('institutionId') institutionId: number,
    @Args() args: ContactTagArgs,
    @ToListConfig() toListConfig: ToListConfig,
    @ToConnection() toConnection: ToConnection<ContactTag>
  ): Promise<ContactTagConnection> {
    const listConfig = toListConfig(args);
    const page = await this.contactsFilterOptionsService.getTags(
      institutionId,
      listConfig
    );
    const connection = toConnection(page);
    return connection;
  }
}
