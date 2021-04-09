import { Field } from '@nestjs/graphql';
import { ScalarWhereInputType } from '../lists/list-args/where-input/where-input';

@ScalarWhereInputType(() => Number)
export class NumberWhereInput {
  @Field({ nullable: true })
  _eq?: number;
}
