import { Field } from '@nestjs/graphql';
import { StringWhereInput } from 'src/application/graphql/inputs/string-where.input';
// import { WhereInputType } from '../../../graphql/lists/list-args/where-input-type.decorator';
// import { QueryCompaniesWhereInput } from '../../company/inputs/query-companies-where.input';

// @WhereInputType()
export class OldQueryContactsWhereInput {
  @Field({ nullable: true })
  firstName?: StringWhereInput;

  @Field({ nullable: true })
  email?: StringWhereInput;

  // @Field({ nullable: true })
  // company?: QueryCompaniesWhereInput;
}
