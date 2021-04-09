import { Field } from '@nestjs/graphql';
import {
  ObjectOrderByInput,
  ObjectOrderByInputType,
} from 'src/application/graphql/lists/list-args/order-by-input/order-by-input';
import { Contact } from 'src/domain/contact/contact.entity';
import { QueryCompaniesOrderByInput } from '../../company/inputs/query-companies-order-by.input';

@ObjectOrderByInputType(() => Contact)
export class ContactOrderByInput extends ObjectOrderByInput(Contact) {
  @Field({ nullable: true })
  company?: QueryCompaniesOrderByInput; // overriden for demo purposes
}
