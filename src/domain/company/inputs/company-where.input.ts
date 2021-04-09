import {
  ObjectWhereInputType,
  ObjectWhereInput,
} from 'src/application/graphql/lists/list-args/where-input/where-input';
import { Company } from 'src/domain/company/company.entity';

@ObjectWhereInputType(() => Company)
export class CompanyWhereInput extends ObjectWhereInput(Company) {}
