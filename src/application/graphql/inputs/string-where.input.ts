import { Field } from '@nestjs/graphql';
import { ScalarWhereInputType } from '../lists/list-args/where-input/where-input';

@ScalarWhereInputType(() => String)
export class StringWhereInput {
  @Field({ nullable: true })
  _eq?: string;

  @Field({ nullable: true })
  _contains?: string;
}
