import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Max, Min, IsOptional } from 'class-validator';
import { ValidateObject } from '../../../../utils/validation/validate-object.decorator';
import { paginationArgsValidator } from './pagination-args.validator';

@ValidateObject<PaginationArgs>(paginationArgsValidator)
@ArgsType()
export class PaginationArgs {
  @IsOptional()
  @Min(1)
  @Max(200)
  @Field(() => Int, { nullable: true })
  first?: number;

  @IsOptional()
  @Min(1)
  @Max(200)
  @Field(() => Int, { nullable: true })
  last?: number;

  @Field({ nullable: true })
  before?: string;

  @Field({ nullable: true })
  after?: string;
}
