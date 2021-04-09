import { ArgsType, Field } from '@nestjs/graphql';
import { BaseListArgs } from 'src/application/graphql/lists/list-args/base-list-args.class';
import { ContactOrderByInput } from '../inputs/query-contacts-order-by.input';
import { Contact } from '../contact.entity';

@ArgsType()
export class ContactListArgs extends BaseListArgs(Contact) {
  @Field({ nullable: true })
  orderBy?: ContactOrderByInput;
}
