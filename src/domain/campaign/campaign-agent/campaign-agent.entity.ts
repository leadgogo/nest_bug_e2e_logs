import {
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import { ListArg } from '../../../application/graphql/lists/list-args/list-arg.decorator';
import { User } from '../../user/user.entity';
import { Campaign } from '../compaign.entity';

@ObjectType()
@Entity()
export class CampaignAgent {
  @Field(() => Intl)
  @PrimaryKey()
  id: number;

  @Field(() => Campaign)
  @ManyToOne()
  campaign: Campaign;

  @Field(() => User)
  @OneToOne(() => User)
  user: User;

  @ListArg()
  @Field()
  @Property()
  type: string;
}
