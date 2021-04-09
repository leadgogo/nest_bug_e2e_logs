import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ContactStage } from '../contact-stage.entity';

@ObjectType()
@Entity({ tableName: 'lead_status' })
export class ContactStatus {
  @Field(() => Int)
  @PrimaryKey()
  id: number;

  @Field()
  @Property()
  nameEn: string;

  @Field()
  @Property()
  nameEs: string;

  // @Field(() => ContactStage)
  @ManyToOne()
  stage: ContactStage;
}
