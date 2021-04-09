import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Collection,
  OneToOne,
} from '@mikro-orm/core';
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { RequirePermission } from '../../application/graphql/decorators/require-permission.decorator';
import { ListArg } from '../../application/graphql/lists/list-args/list-arg.decorator';
import { Campaign } from '../campaign/compaign.entity';
import { Contact } from '../contact/contact.entity';
import { Institution } from '../institution/institution.entity';

// @RequirePermission('view-company')
@ObjectType()
@Entity()
export class Company {
  @Field(() => Int)
  @PrimaryKey()
  id: number;

  @ListArg()
  @Field({ nullable: true })
  @Property()
  name?: string;

  @ListArg()
  @RequirePermission('view-timezone')
  @Field({ nullable: true })
  @Property()
  timezone?: string;

  @OneToOne({ joinColumn: 'id' })
  institution: Institution;

  @ListArg(['Contact'])
  @OneToMany('Contact', 'company')
  contacts = new Collection<Contact>(this);

  @ListArg(['Campaign'])
  @OneToMany('Campaign', 'company')
  campaigns = new Collection<Campaign>(this);
}
