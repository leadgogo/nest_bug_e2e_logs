import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ListArg } from 'src/application/graphql/lists/list-args/list-arg.decorator';
import { Company } from 'src/domain/company/company.entity';
import { DependsOn } from 'src/infrastructure/database/depends-on.decorator';

@ObjectType()
@Entity({ tableName: 'lead' })
export class Contact {
  @ListArg()
  @Field(() => Int)
  @PrimaryKey()
  id: number;

  @ListArg()
  @Field({ nullable: true })
  @Property()
  firstName?: string;

  @Field({ nullable: true })
  @Property()
  lastName?: string;

  @Field(() => String, { nullable: true })
  @DependsOn<Contact>('firstName', 'lastName')
  get fullName() {
    return `${this.firstName ?? ''} ${this.lastName ?? ''}`.trim();
  }

  // @RequirePermission('view-email')
  @ListArg()
  @Field({ nullable: true })
  @Property()
  email?: string;

  @Field({ nullable: true })
  @Property()
  phoneCel?: string;

  @Field(() => String)
  get phoneProxy() {
    return `787-331-3423,##${this.id}`;
  }

  @ListArg()
  @Field(() => Company, { nullable: true })
  @ManyToOne()
  company?: Company;

  @Field()
  @Property()
  createdAt: Date = new Date();

  @Field()
  @Property()
  updatedAt: Date = new Date();
}
