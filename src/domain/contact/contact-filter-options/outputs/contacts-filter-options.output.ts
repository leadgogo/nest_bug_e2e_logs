import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../../user/user.entity';
import { ContactStage } from '../../contact-stage/contact-stage.entity';

@ObjectType()
export class ContactsFilterOptionsOutput {
  @Field(() => [ContactStage])
  stages?: ContactStage[];

  @Field(() => [User])
  accounts?: User[];
}
