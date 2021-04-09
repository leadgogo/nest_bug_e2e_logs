import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ListArg } from '../../../application/graphql/lists/list-args/list-arg.decorator';
import { Company } from '../../company/company.entity';

@ObjectType()
@Entity({ tableName: 'lead_tag' })
export class ContactTag {
  @Field(() => Int)
  @PrimaryKey()
  id: number;

  @ListArg()
  @Field()
  @Property()
  name?: string;

  @Field()
  @Property()
  isActive: boolean;

  @ManyToOne('Company')
  company: Company;
}
