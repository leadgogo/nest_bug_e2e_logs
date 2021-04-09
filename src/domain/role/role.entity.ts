import {
  PrimaryKey,
  Property,
  Entity,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { UserInstitutionRole } from '../user/user-institution-role.entity';

@ObjectType()
@Entity()
export class Role {
  @Field(() => Int)
  @PrimaryKey()
  id: string;

  @Field()
  @Property()
  name: string;

  @Field()
  @Property()
  description: string;

  @Property()
  institutionType: string;

  @Property()
  lft: number;

  @Property()
  rgt: number;

  @OneToMany('UserInstitutionRole', 'role')
  institutionRoles = new Collection<UserInstitutionRole>(this);
}
