import { ArgsType } from '@nestjs/graphql';
import { BaseListArgs } from '../../../application/graphql/lists/list-args/base-list-args.class';
import { Company } from '../company.entity';

@ArgsType()
export class CompanyListArgs extends BaseListArgs(Company) {}
