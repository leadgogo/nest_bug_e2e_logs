import {
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ContactStatus } from './contact-status/contact-status.entity';

@ObjectType()
@Entity({ tableName: 'lead_stage' })
export class ContactStage {
  @Field(() => Int)
  @PrimaryKey()
  id: number;

  @Field()
  @Property()
  slug: string;

  @Property()
  nameEn: string;

  @Property()
  nameEs: string;

  // @Field(() => [ContactStatus])
  // statuses: ContactStatus[];
  @OneToMany('ContactStatus', 'stage')
  statuses = new Collection<ContactStatus>(this);
}
