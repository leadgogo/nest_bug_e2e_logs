import {
  Entity,
  PrimaryKey,
  Property,
  Collection,
  OneToMany,
  ManyToOne,
} from '@mikro-orm/core';
import { UserInstitutionRole } from './user-institution-role.entity';
import { Institution } from '../institution/institution.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { DependsOn } from '../../infrastructure/database/depends-on.decorator';

@ObjectType()
@Entity({ tableName: 'account' })
export class User {
  @Field(() => Int)
  @PrimaryKey()
  id: number;

  @Field({ nullable: true })
  @Property()
  firstName?: string;

  @Field({ nullable: true })
  @Property()
  lastName?: string;

  @Field(() => String, { nullable: true })
  @DependsOn<User>('firstName', 'lastName')
  get fullName() {
    return `${this.firstName ?? ''} ${this.lastName ?? ''}`.trim();
  }

  @Property()
  username: string;

  @Field(() => String, { nullable: true })
  @Property()
  email?: string;

  @Property({ hidden: true })
  passwordHash: string;

  @Property({ hidden: true })
  passwordSalt: string;

  @Field()
  @Property()
  active: boolean;

  @Property()
  institutionId: number;

  @ManyToOne('Institution')
  institution: Institution;

  @OneToMany('UserInstitutionRole', 'user')
  institutionRoles = new Collection<UserInstitutionRole>(this);
}
