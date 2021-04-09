import { Field, ObjectType } from '@nestjs/graphql';
import { Contact } from 'src/domain/contact/contact.entity';

@ObjectType()
export class CreateContactOutput {
  @Field({ nullable: true })
  contact: Contact;
}
