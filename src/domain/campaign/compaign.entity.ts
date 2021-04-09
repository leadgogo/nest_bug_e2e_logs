import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ListArg } from '../../application/graphql/lists/list-args/list-arg.decorator';
import { Company } from '../company/company.entity';
import { CampaignAgent } from './campaign-agent/campaign-agent.entity';

@ObjectType()
@Entity()
export class Campaign {
  @Field(() => Int)
  @PrimaryKey()
  id: number;

  @ListArg()
  @Field()
  @Property()
  name: string;

  @Field(() => Company)
  @ManyToOne()
  company: Company;

  @ListArg(['CampaignAgent'])
  @OneToMany('CampaignAgent', 'campaign')
  agents = new Collection<CampaignAgent>(this);
}
